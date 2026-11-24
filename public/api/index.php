<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Handle route resolution from .htaccess (?route=...) or REQUEST_URI
$route = '';
if (isset($_GET['route']) && is_string($_GET['route'])) {
    $route = trim($_GET['route'], '/');
} else {
    $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $pos = strpos($uriPath, '/api/');
    if ($pos !== false) {
        $route = trim(substr($uriPath, $pos + 5), '/');
    }
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

function jsonOut(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function readJsonBody(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    if ($route === 'health' || $route === 'auth/status' || $route === 'state') {
        jsonOut([
            'ok' => false,
            'dbConfigured' => false,
            'engine' => 'mysql',
            'adminConfigured' => false,
            'members' => [],
            'parishes' => [],
            'deaneries' => [],
            'events' => [],
            'remittances' => [],
            'vocations' => [],
            'welfare' => [],
            'niccaStudents' => [],
            'challengeTeams' => [],
            'careerRegistrations' => [],
            'matronsPatrons' => [],
            'secondaryYouth' => [],
            'parishBatches' => [],
        ]);
    }
    jsonOut(['error' => 'Database is not configured yet. Copy api/config.example.php to api/config.php on HostPinnacle.'], 503);
}

$config = require $configPath;
$dbHost = (string)($config['DB_HOST'] ?? 'localhost');
$dbName = (string)($config['DB_NAME'] ?? '');
$dbUser = (string)($config['DB_USER'] ?? '');
$dbPass = (string)($config['DB_PASS'] ?? '');
$configAdminUser = (string)($config['ADMIN_USERNAME'] ?? 'admin');
$configAdminPass = (string)($config['ADMIN_PASSCODE'] ?? '');
$tokenSecret = (string)($config['TOKEN_SECRET'] ?? '');

if ($dbName === '' || $dbUser === '') {
    jsonOut(['error' => 'Please fill DB_NAME and DB_USER inside api/config.php.'], 503);
}

if ($tokenSecret === '') {
    // Fallback secret derived from DB config if TOKEN_SECRET wasn't filled
    $tokenSecret = hash('sha256', $dbHost . '|' . $dbName . '|' . $dbUser . '|' . __FILE__);
}

try {
    $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (Throwable $e) {
    jsonOut(['error' => 'Could not connect to MySQL database. Check api/config.php credentials.'], 503);
}

// ---------------------------------------------------------------------------
// Security & Helpers
// ---------------------------------------------------------------------------
function base64UrlEncode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string {
    $pad = strlen($data) % 4;
    if ($pad > 0) {
        $data .= str_repeat('=', 4 - $pad);
    }
    $decoded = base64_decode(strtr($data, '-_', '+/'), true);
    return $decoded === false ? '' : $decoded;
}

function signToken(array $payload, string $secret): string {
    $payload['exp'] = (int)(microtime(true) * 1000) + (1000 * 60 * 60 * 12);
    $body = base64UrlEncode(json_encode($payload, JSON_UNESCAPED_UNICODE));
    $sig = base64UrlEncode(hash_hmac('sha256', $body, $secret, true));
    return $body . '.' . $sig;
}

function verifyToken(?string $token, string $secret): ?array {
    if (!$token || !str_contains($token, '.')) {
        return null;
    }
    [$body, $sig] = explode('.', $token, 2);
    if ($body === '' || $sig === '') {
        return null;
    }
    $expected = base64UrlEncode(hash_hmac('sha256', $body, $secret, true));
    if (!hash_equals($expected, $sig)) {
        return null;
    }
    $parsed = json_decode(base64UrlDecode($body), true);
    if (!is_array($parsed) || !isset($parsed['exp'])) {
        return null;
    }
    if ((int)$parsed['exp'] < (int)(microtime(true) * 1000)) {
        return null;
    }
    return $parsed;
}

function getBearerHeader(): ?string {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($auth === '' && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        foreach ($headers as $k => $v) {
            if (strtolower((string)$k) === 'authorization') {
                $auth = (string)$v;
                break;
            }
        }
    }
    if (str_starts_with($auth, 'Bearer ')) {
        return trim(substr($auth, 7));
    }
    return null;
}

function requireAdmin(string $tokenSecret): array {
    $session = verifyToken(getBearerHeader(), $tokenSecret);
    if (!$session || ($session['role'] ?? '') !== 'admin') {
        jsonOut(['error' => 'Admin authentication required.'], 401);
    }
    return $session;
}

function isAdminConfigured(PDO $pdo, string $configAdminPass): bool {
    if (trim($configAdminPass) !== '') {
        return true;
    }
    $stmt = $pdo->query('SELECT id FROM admin_config WHERE id = 1 LIMIT 1');
    return (bool)$stmt->fetch();
}

function stripSecrets(array $row): array {
    unset($row['password'], $row['passwordHash'], $row['loginPin']);
    return $row;
}

function normalizePhone(string $val): string {
    return trim((string)preg_replace('/\s+/', '', $val));
}

function isValidImageDataUrl(string $val): bool {
    return (bool)preg_match('/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+\/=]+$/i', $val);
}

function nextSequentialId(PDO $pdo, string $table, string $prefix, int $padLen): string {
    $stmt = $pdo->query("SELECT id FROM {$table}");
    $rows = $stmt->fetchAll();
    $max = count($rows);
    foreach ($rows as $r) {
        if (preg_match('/(\d+)$/', (string)$r['id'], $m)) {
            $n = (int)$m[1];
            if ($n > $max) {
                $max = $n;
            }
        }
    }
    return $prefix . str_pad((string)($max + 1), $padLen, '0', STR_PAD_LEFT);
}

function parseJsonRows(PDO $pdo, string $sql): array {
    $stmt = $pdo->query($sql);
    $out = [];
    while ($row = $stmt->fetch()) {
        $decoded = json_decode((string)$row['payload_json'], true);
        if (is_array($decoded)) {
            $out[] = stripSecrets($decoded);
        }
    }
    return $out;
}

function getAllState(PDO $pdo, string $configAdminPass): array {
    return [
        'dbConfigured' => true,
        'engine' => 'mysql',
        'adminConfigured' => isAdminConfigured($pdo, $configAdminPass),
        'members' => parseJsonRows($pdo, 'SELECT payload_json FROM youth_members ORDER BY created_at DESC'),
        'parishes' => parseJsonRows($pdo, 'SELECT payload_json FROM parishes ORDER BY name ASC'),
        'deaneries' => parseJsonRows($pdo, 'SELECT payload_json FROM deaneries ORDER BY name ASC'),
        'events' => parseJsonRows($pdo, 'SELECT payload_json FROM events ORDER BY start_date DESC'),
        'remittances' => parseJsonRows($pdo, 'SELECT payload_json FROM remittances ORDER BY created_at DESC'),
        'vocations' => parseJsonRows($pdo, 'SELECT payload_json FROM vocations ORDER BY created_at DESC'),
        'welfare' => parseJsonRows($pdo, 'SELECT payload_json FROM welfare ORDER BY created_at DESC'),
        'niccaStudents' => parseJsonRows($pdo, 'SELECT payload_json FROM nicca_students ORDER BY created_at DESC'),
        'challengeTeams' => parseJsonRows($pdo, 'SELECT payload_json FROM challenge_teams ORDER BY created_at DESC'),
        'careerRegistrations' => parseJsonRows($pdo, 'SELECT payload_json FROM career_registrations ORDER BY created_at DESC'),
        'matronsPatrons' => parseJsonRows($pdo, 'SELECT payload_json FROM matrons_patrons ORDER BY created_at DESC'),
        'secondaryYouth' => parseJsonRows($pdo, 'SELECT payload_json FROM secondary_youth ORDER BY created_at DESC'),
        'parishBatches' => parseJsonRows($pdo, 'SELECT payload_json FROM parish_batches ORDER BY created_at DESC'),
    ];
}

// ---------------------------------------------------------------------------
// Route Handlers
// ---------------------------------------------------------------------------
if ($method === 'GET' && ($route === 'health' || $route === 'auth/status')) {
    jsonOut([
        'ok' => true,
        'dbConfigured' => true,
        'engine' => 'mysql',
        'adminConfigured' => isAdminConfigured($pdo, $configAdminPass),
    ]);
}

if ($method === 'GET' && $route === 'state') {
    jsonOut(getAllState($pdo, $configAdminPass));
}

if ($method === 'POST' && $route === 'auth/admin-setup') {
    if (isAdminConfigured($pdo, $configAdminPass)) {
        jsonOut(['error' => 'Admin password is already configured.'], 409);
    }
    $body = readJsonBody();
    $username = trim((string)($body['username'] ?? 'admin')) ?: 'admin';
    $password = trim((string)($body['password'] ?? ''));
    if (strlen($password) < 4) {
        jsonOut(['error' => 'Admin password must be at least 4 characters.'], 400);
    }
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $now = gmdate('c');
    $stmt = $pdo->prepare('REPLACE INTO admin_config (id, username, password_hash, updated_at) VALUES (1, ?, ?, ?)');
    $stmt->execute([$username, $hash, $now]);
    $token = signToken(['role' => 'admin', 'username' => $username], $tokenSecret);
    jsonOut(['ok' => true, 'token' => $token, 'username' => $username]);
}

if ($method === 'POST' && $route === 'auth/admin-login') {
    $body = readJsonBody();
    $username = trim((string)($body['username'] ?? ''));
    $password = trim((string)($body['password'] ?? ''));

    if (!isAdminConfigured($pdo, $configAdminPass)) {
        jsonOut(['error' => 'Admin password is not configured yet. Set it up first.'], 400);
    }

    if (trim($configAdminPass) !== '') {
        if (strtolower($username) === strtolower($configAdminUser) && hash_equals($configAdminPass, $password)) {
            $token = signToken(['role' => 'admin', 'username' => $configAdminUser], $tokenSecret);
            jsonOut(['ok' => true, 'token' => $token, 'username' => $configAdminUser]);
        }
        jsonOut(['error' => 'Invalid username or password. Access denied.'], 401);
    }

    $stmt = $pdo->query('SELECT username, password_hash FROM admin_config WHERE id = 1 LIMIT 1');
    $row = $stmt->fetch();
    if (!$row || strtolower($username) !== strtolower((string)$row['username']) || !password_verify($password, (string)$row['password_hash'])) {
        jsonOut(['error' => 'Invalid username or password. Access denied.'], 401);
    }
    $token = signToken(['role' => 'admin', 'username' => $row['username']], $tokenSecret);
    jsonOut(['ok' => true, 'token' => $token, 'username' => $row['username']]);
}

if ($method === 'POST' && $route === 'auth/login') {
    $body = readJsonBody();
    $scope = trim((string)($body['scope'] ?? ''));
    $identifier = trim((string)($body['identifier'] ?? ''));
    $password = trim((string)($body['password'] ?? ''));

    if ($scope === '' || $identifier === '' || $password === '') {
        jsonOut(['error' => 'Please enter both your login identifier and password.'], 400);
    }

    $cleanPhone = normalizePhone($identifier);
    $cleanLower = strtolower($identifier);

    if ($scope === 'parish-leader') {
        $rows = $pdo->query('SELECT * FROM parish_leaders')->fetchAll();
        foreach ($rows as $l) {
            if (normalizePhone((string)$l['leader_phone']) === $cleanPhone || (string)$l['leader_phone'] === $identifier) {
                if (password_verify($password, (string)$l['password_hash'])) {
                    $batch = null;
                    if (!empty($l['batch_id'])) {
                        $bStmt = $pdo->prepare('SELECT payload_json FROM parish_batches WHERE id = ? LIMIT 1');
                        $bStmt->execute([$l['batch_id']]);
                        $bRow = $bStmt->fetch();
                        if ($bRow) {
                            $batch = stripSecrets(json_decode((string)$bRow['payload_json'], true) ?: []);
                        }
                    }
                    $token = signToken([
                        'role' => 'leader',
                        'leaderPhone' => $l['leader_phone'],
                        'batchId' => $batch['id'] ?? $l['batch_id'] ?? null,
                    ], $tokenSecret);
                    jsonOut([
                        'ok' => true,
                        'token' => $token,
                        'leader' => [
                            'leaderPhone' => $l['leader_phone'],
                            'leaderName' => $l['leader_name'],
                            'deaneryName' => $l['deanery_name'],
                            'parishName' => $l['parish_name'],
                            'localChurch' => $l['local_church'],
                            'batchId' => $l['batch_id'] ?? ($batch['id'] ?? null),
                        ],
                        'batch' => $batch,
                    ]);
                }
            }
        }
        jsonOut(['error' => 'Incorrect phone number or password. Please verify and try again.'], 401);
    }

    if ($scope === 'junior-youth') {
        $rows = $pdo->query("SELECT payload_json, password_hash FROM youth_members WHERE movement = 'Junior Youth'")->fetchAll();
        foreach ($rows as $r) {
            $m = json_decode((string)$r['payload_json'], true);
            if (!is_array($m)) continue;
            $matches = strtolower((string)($m['id'] ?? '')) === $cleanLower || normalizePhone((string)($m['phone'] ?? '')) === $cleanPhone;
            if ($matches && !empty($r['password_hash']) && password_verify($password, (string)$r['password_hash'])) {
                $token = signToken(['role' => 'member', 'scope' => 'junior-youth', 'id' => $m['id']], $tokenSecret);
                jsonOut(['ok' => true, 'token' => $token, 'record' => stripSecrets($m)]);
            }
        }
        jsonOut(['error' => 'Invalid phone number/ID or password.'], 401);
    }

    if ($scope === 'nicca') {
        $rows = $pdo->query('SELECT payload_json, password_hash FROM nicca_students')->fetchAll();
        foreach ($rows as $r) {
            $s = json_decode((string)$r['payload_json'], true);
            if (!is_array($s)) continue;
            $matches = strtolower((string)($s['id'] ?? '')) === $cleanLower || normalizePhone((string)($s['phone'] ?? '')) === $cleanPhone;
            if ($matches && !empty($r['password_hash']) && password_verify($password, (string)$r['password_hash'])) {
                $token = signToken(['role' => 'member', 'scope' => 'nicca', 'id' => $s['id']], $tokenSecret);
                jsonOut(['ok' => true, 'token' => $token, 'record' => stripSecrets($s)]);
            }
        }
        jsonOut(['error' => 'Invalid phone number/student ID or password.'], 401);
    }

    if ($scope === 'challenge-week') {
        $rows = $pdo->query('SELECT payload_json, password_hash, login_pin_hash FROM challenge_teams')->fetchAll();
        foreach ($rows as $r) {
            $t = json_decode((string)$r['payload_json'], true);
            if (!is_array($t)) continue;
            $matches = strtolower((string)($t['id'] ?? '')) === $cleanLower
                || normalizePhone((string)($t['teamLeaderPhone'] ?? '')) === $cleanPhone
                || strtolower((string)($t['username'] ?? '')) === $cleanLower;
            $passOk = (!empty($r['password_hash']) && password_verify($password, (string)$r['password_hash']))
                || (!empty($r['login_pin_hash']) && password_verify($password, (string)$r['login_pin_hash']));
            if ($matches && $passOk) {
                $token = signToken(['role' => 'member', 'scope' => 'challenge-week', 'id' => $t['id']], $tokenSecret);
                jsonOut(['ok' => true, 'token' => $token, 'record' => stripSecrets($t)]);
            }
        }
        jsonOut(['error' => 'Invalid username/phone/code or password.'], 401);
    }

    if ($scope === 'career-day') {
        $rows = $pdo->query('SELECT payload_json, password_hash FROM career_registrations')->fetchAll();
        foreach ($rows as $r) {
            $c = json_decode((string)$r['payload_json'], true);
            if (!is_array($c)) continue;
            $matches = strtolower((string)($c['id'] ?? '')) === $cleanLower
                || normalizePhone((string)($c['phone'] ?? '')) === $cleanPhone
                || strtolower((string)($c['username'] ?? '')) === $cleanLower;
            if ($matches && !empty($r['password_hash']) && password_verify($password, (string)$r['password_hash'])) {
                $token = signToken(['role' => 'member', 'scope' => 'career-day', 'id' => $c['id']], $tokenSecret);
                jsonOut(['ok' => true, 'token' => $token, 'record' => stripSecrets($c)]);
            }
        }
        jsonOut(['error' => 'Invalid username/phone or password.'], 401);
    }

    if ($scope === 'matrons-patrons') {
        $rows = $pdo->query('SELECT payload_json, password_hash FROM matrons_patrons')->fetchAll();
        foreach ($rows as $r) {
            $a = json_decode((string)$r['payload_json'], true);
            if (!is_array($a)) continue;
            $matches = strtolower((string)($a['id'] ?? '')) === $cleanLower || normalizePhone((string)($a['phone'] ?? '')) === $cleanPhone;
            if ($matches && !empty($r['password_hash']) && password_verify($password, (string)$r['password_hash'])) {
                $token = signToken(['role' => 'member', 'scope' => 'matrons-patrons', 'id' => $a['id']], $tokenSecret);
                jsonOut(['ok' => true, 'token' => $token, 'record' => stripSecrets($a)]);
            }
        }
        jsonOut(['error' => 'Invalid phone number/ID or password.'], 401);
    }

    jsonOut(['error' => 'Unsupported login scope.'], 400);
}

// ---------------------------------------------------------------------------
// Public Registrations
// ---------------------------------------------------------------------------
if ($method === 'POST' && $route === 'parish-batches') {
    $body = readJsonBody();
    $batchData = $body['batchData'] ?? null;
    $names = $body['names'] ?? null;
    if (!is_array($batchData) || !is_array($names) || count($names) === 0 || count($names) > 200) {
        jsonOut(['error' => 'Provide batch details and 1-200 member names.'], 400);
    }
    $leaderPhone = trim((string)($batchData['leaderPhone'] ?? ''));
    $leaderName = trim((string)($batchData['leaderName'] ?? ''));
    $localChurch = trim((string)($batchData['localChurch'] ?? ''));
    $mpesaCode = strtoupper(trim((string)($batchData['mpesaCode'] ?? '')));
    $rawPass = trim((string)($batchData['password'] ?? ''));
    if ($leaderPhone === '' || $leaderName === '' || $localChurch === '' || $mpesaCode === '' || strlen($rawPass) < 3) {
        jsonOut(['error' => 'Leader phone, name, password, local church, and M-Pesa code are required.'], 400);
    }

    $batchId = 'BATCH-' . (string)round(microtime(true) * 1000);
    $now = gmdate('Y-m-d');
    $passwordHash = password_hash($rawPass, PASSWORD_DEFAULT);

    $existingRows = $pdo->query('SELECT id FROM youth_members')->fetchAll();
    $maxNum = count($existingRows);
    foreach ($existingRows as $r) {
        if (preg_match('/(\d+)$/', (string)$r['id'], $m)) {
            $n = (int)$m[1];
            if ($n > $maxNum) $maxNum = $n;
        }
    }

    $createdMembers = [];
    $pdo->beginTransaction();
    try {
        $memStmt = $pdo->prepare(
            'INSERT INTO youth_members (id, full_name, phone, movement, deanery_id, parish_id, deanery_name, parish_name, local_church, approval_status, batch_id, mpesa_ref, password_hash, payload_json, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($names as $idx => $rawName) {
            $name = trim((string)$rawName);
            if ($name === '') continue;
            $maxNum++;
            $formattedId = 'ADN-PRSH-2026-' . str_pad((string)$maxNum, 4, '0', STR_PAD_LEFT);
            $member = [
                'id' => $formattedId,
                'fullName' => $name,
                'gender' => ($idx % 2 === 0) ? 'Male' : 'Female',
                'dob' => '2004-01-01',
                'age' => 21,
                'phone' => $leaderPhone,
                'email' => preg_replace('/[^a-z0-9]/', '', strtolower($name)) . '@adn-youth.org',
                'deaneryId' => (string)($batchData['deaneryId'] ?? ''),
                'parishId' => (string)($batchData['parishId'] ?? ''),
                'subParish' => $localChurch,
                'movement' => 'CYO',
                'occupation' => 'Parish Youth Member',
                'sacraments' => [
                    'baptism' => true,
                    'firstCommunion' => true,
                    'confirmation' => false,
                    'matrimony' => false,
                ],
                'ministryGuild' => 'Parish Youth Group',
                'leadershipRole' => 'Member',
                'emergencyContact' => [
                    'name' => $leaderName,
                    'relation' => 'Youth Leader',
                    'phone' => $leaderPhone,
                ],
                'joinedDate' => $now,
                'status' => 'Active',
                'skills' => ['Parish Youth'],
                'approvalStatus' => 'Pending',
                'registeredByLeaderPhone' => $leaderPhone,
                'registeredByLeaderName' => $leaderName,
                'localChurch' => $localChurch,
                'mpesaRef' => $mpesaCode,
                'registrationFee' => 100,
                'batchId' => $batchId,
                'deaneryName' => (string)($batchData['deaneryName'] ?? ''),
                'parishName' => (string)($batchData['parishName'] ?? ''),
            ];
            $memStmt->execute([
                $member['id'],
                $member['fullName'],
                $member['phone'],
                $member['movement'],
                $member['deaneryId'],
                $member['parishId'],
                $member['deaneryName'],
                $member['parishName'],
                $localChurch,
                'Pending',
                $batchId,
                $mpesaCode,
                null,
                json_encode($member, JSON_UNESCAPED_UNICODE),
                $now,
            ]);
            $createdMembers[] = $member;
        }

        $totalFee = count($createdMembers) * 100;
        $newBatch = [
            'id' => $batchId,
            'leaderPhone' => $leaderPhone,
            'leaderName' => $leaderName,
            'deaneryId' => (string)($batchData['deaneryId'] ?? ''),
            'deaneryName' => (string)($batchData['deaneryName'] ?? ''),
            'parishId' => (string)($batchData['parishId'] ?? ''),
            'parishName' => (string)($batchData['parishName'] ?? ''),
            'localChurch' => $localChurch,
            'memberCount' => count($createdMembers),
            'feePerMember' => 100,
            'totalFee' => $totalFee,
            'mpesaCode' => $mpesaCode,
            'mpesaPhone' => (string)($batchData['mpesaPhone'] ?? $leaderPhone),
            'paymentStatus' => 'Pending',
            'approvalStatus' => 'Pending',
            'submittedAt' => $now,
            'memberIds' => array_map(fn($m) => $m['id'], $createdMembers),
        ];

        $pdo->prepare(
            'INSERT INTO parish_batches (id, leader_phone, leader_name, deanery_name, parish_name, local_church, member_count, total_fee, mpesa_code, approval_status, password_hash, payload_json, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $batchId,
            $leaderPhone,
            $leaderName,
            $newBatch['deaneryName'],
            $newBatch['parishName'],
            $localChurch,
            $newBatch['memberCount'],
            $totalFee,
            $mpesaCode,
            'Pending',
            $passwordHash,
            json_encode($newBatch, JSON_UNESCAPED_UNICODE),
            $now,
        ]);

        $pdo->prepare(
            'REPLACE INTO parish_leaders (leader_phone, leader_name, deanery_name, parish_name, local_church, batch_id, password_hash, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $leaderPhone,
            $leaderName,
            $newBatch['deaneryName'],
            $newBatch['parishName'],
            $localChurch,
            $batchId,
            $passwordHash,
            $now,
        ]);

        $pdo->commit();
        $leaderToken = signToken(['role' => 'leader', 'leaderPhone' => $leaderPhone, 'batchId' => $batchId], $tokenSecret);
        jsonOut(['batch' => $newBatch, 'newMembers' => $createdMembers, 'leaderToken' => $leaderToken], 201);
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonOut(['error' => 'Failed to save parish batch registration.'], 500);
    }
}

if ($method === 'POST' && $route === 'members') {
    $data = readJsonBody();
    if (trim((string)($data['fullName'] ?? '')) === '') {
        jsonOut(['error' => 'Member full name is required.'], 400);
    }
    $newId = nextSequentialId($pdo, 'youth_members', 'ADN-YTH-2026-', 4);
    $rawPass = trim((string)($data['password'] ?? ''));
    $passHash = $rawPass !== '' ? password_hash($rawPass, PASSWORD_DEFAULT) : null;
    $createdAt = (string)($data['joinedDate'] ?? gmdate('Y-m-d'));
    $clean = stripSecrets($data);
    $clean['id'] = $newId;
    $clean['approvalStatus'] = $data['approvalStatus'] ?? 'Confirmed';

    $pdo->prepare(
        'INSERT INTO youth_members (id, full_name, phone, movement, deanery_id, parish_id, deanery_name, parish_name, local_church, approval_status, batch_id, mpesa_ref, password_hash, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $clean['id'],
        $clean['fullName'],
        $clean['phone'] ?? '',
        $clean['movement'] ?? 'CYO',
        $clean['deaneryId'] ?? '',
        $clean['parishId'] ?? '',
        $clean['deaneryName'] ?? '',
        $clean['parishName'] ?? '',
        $clean['localChurch'] ?? ($clean['subParish'] ?? ''),
        $clean['approvalStatus'],
        $clean['batchId'] ?? null,
        $clean['mpesaRef'] ?? null,
        $passHash,
        json_encode($clean, JSON_UNESCAPED_UNICODE),
        $createdAt,
    ]);

    $token = signToken(['role' => 'member', 'scope' => 'junior-youth', 'id' => $clean['id']], $tokenSecret);
    jsonOut(['member' => $clean, 'token' => $token], 201);
}

if ($method === 'POST' && $route === 'nicca') {
    $data = readJsonBody();
    if (trim((string)($data['fullName'] ?? '')) === '' || trim((string)($data['institution'] ?? '')) === '' || trim((string)($data['phone'] ?? '')) === '') {
        jsonOut(['error' => 'Full name, institution, and phone are required.'], 400);
    }
    $newId = nextSequentialId($pdo, 'nicca_students', 'NICCA-2027-', 3);
    $rawPass = trim((string)($data['password'] ?? ''));
    $passHash = $rawPass !== '' ? password_hash($rawPass, PASSWORD_DEFAULT) : null;
    $regDate = gmdate('Y-m-d');
    $clean = stripSecrets($data);
    $clean['id'] = $newId;
    $clean['registrationDate'] = $regDate;
    $clean['amountPaid'] = isset($data['amountPaid']) ? (float)$data['amountPaid'] : 100;
    $clean['paymentStatus'] = $data['paymentStatus'] ?? 'Paid';

    $pdo->prepare(
        'INSERT INTO nicca_students (id, full_name, institution, phone, mpesa_code, amount_paid, payment_status, password_hash, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $clean['id'],
        $clean['fullName'],
        $clean['institution'],
        $clean['phone'],
        $clean['mpesaCode'] ?? null,
        $clean['amountPaid'],
        $clean['paymentStatus'],
        $passHash,
        json_encode($clean, JSON_UNESCAPED_UNICODE),
        $regDate,
    ]);

    $token = signToken(['role' => 'member', 'scope' => 'nicca', 'id' => $clean['id']], $tokenSecret);
    jsonOut(['student' => $clean, 'token' => $token], 201);
}

if ($method === 'POST' && $route === 'challenge-teams') {
    $data = readJsonBody();
    if (trim((string)($data['teamName'] ?? '')) === '' || trim((string)($data['teamLeaderPhone'] ?? '')) === '') {
        jsonOut(['error' => 'Name and phone number are required.'], 400);
    }
    $newId = nextSequentialId($pdo, 'challenge_teams', 'CHALL-2027-', 2);
    $rawPass = trim((string)($data['password'] ?? ''));
    $rawPin = trim((string)($data['loginPin'] ?? ''));
    $passHash = $rawPass !== '' ? password_hash($rawPass, PASSWORD_DEFAULT) : null;
    $pinHash = $rawPin !== '' ? password_hash($rawPin, PASSWORD_DEFAULT) : null;
    $regDate = gmdate('Y-m-d');

    $cleanPhotos = [];
    if (isset($data['memberPhotos']) && is_array($data['memberPhotos'])) {
        foreach ($data['memberPhotos'] as $k => $v) {
            if (is_string($v) && isValidImageDataUrl($v)) {
                $cleanPhotos[(string)$k] = $v;
            }
        }
    }

    $clean = stripSecrets($data);
    $clean['id'] = $newId;
    $clean['registrationDate'] = $regDate;
    $clean['paymentStatus'] = $data['paymentStatus'] ?? 'Pending Verification';
    if (!empty($cleanPhotos)) {
        $clean['memberPhotos'] = $cleanPhotos;
    }

    $pdo->prepare(
        'INSERT INTO challenge_teams (id, team_name, registration_type, deanery_name, parish_name, local_church, team_leader_name, team_leader_phone, members_count, total_fee, mpesa_code, payment_status, username, password_hash, login_pin_hash, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $clean['id'],
        $clean['teamName'],
        $clean['registrationType'] ?? 'Individual',
        $clean['deaneryName'] ?? '',
        $clean['parishName'] ?? '',
        $clean['localChurch'] ?? '',
        $clean['teamLeaderName'] ?? '',
        $clean['teamLeaderPhone'] ?? '',
        (int)($clean['membersCount'] ?? 1),
        (float)($clean['totalFee'] ?? 1000),
        $clean['mpesaCode'] ?? null,
        $clean['paymentStatus'] ?? 'Pending Verification',
        $clean['username'] ?? null,
        $passHash,
        $pinHash,
        json_encode($clean, JSON_UNESCAPED_UNICODE),
        $regDate,
    ]);

    $token = signToken(['role' => 'member', 'scope' => 'challenge-week', 'id' => $clean['id']], $tokenSecret);
    jsonOut(['team' => $clean, 'token' => $token], 201);
}

if ($method === 'POST' && preg_match('#^challenge-teams/([^/]+)/photo$#', $route, $m)) {
    $teamId = $m[1];
    $session = verifyToken(getBearerHeader(), $tokenSecret);
    $isOwner = $session && (($session['role'] ?? '') === 'admin' || (($session['role'] ?? '') === 'member' && ($session['scope'] ?? '') === 'challenge-week' && ($session['id'] ?? '') === $teamId));
    if (!$isOwner) {
        jsonOut(['error' => 'Authentication required to upload photo.'], 401);
    }

    $body = readJsonBody();
    $memberIndex = $body['memberIndex'] ?? -1;
    $photoDataUrl = (string)($body['photoDataUrl'] ?? '');
    if (!is_int($memberIndex) && !ctype_digit((string)$memberIndex)) {
        jsonOut(['error' => 'Valid member index is required.'], 400);
    }
    if (!isValidImageDataUrl($photoDataUrl)) {
        jsonOut(['error' => 'Valid JPEG, PNG, or WEBP image data URL is required.'], 400);
    }

    $stmt = $pdo->prepare('SELECT payload_json FROM challenge_teams WHERE id = ? LIMIT 1');
    $stmt->execute([$teamId]);
    $row = $stmt->fetch();
    if (!$row) {
        jsonOut(['error' => 'Challenge Week record not found.'], 404);
    }

    $team = json_decode((string)$row['payload_json'], true) ?: [];
    if (!isset($team['memberPhotos']) || !is_array($team['memberPhotos'])) {
        $team['memberPhotos'] = [];
    }
    $team['memberPhotos'][(string)$memberIndex] = $photoDataUrl;
    $pdo->prepare('UPDATE challenge_teams SET payload_json = ? WHERE id = ?')->execute([
        json_encode($team, JSON_UNESCAPED_UNICODE),
        $teamId,
    ]);

    jsonOut(['ok' => true, 'team' => stripSecrets($team)]);
}

if ($method === 'POST' && $route === 'career-day') {
    $data = readJsonBody();
    if (trim((string)($data['fullName'] ?? '')) === '' || trim((string)($data['phone'] ?? '')) === '') {
        jsonOut(['error' => 'Full name and phone number are required.'], 400);
    }
    $newId = nextSequentialId($pdo, 'career_registrations', 'CAR-2027-', 3);
    $rawPass = trim((string)($data['password'] ?? ''));
    $passHash = $rawPass !== '' ? password_hash($rawPass, PASSWORD_DEFAULT) : null;
    $regDate = gmdate('Y-m-d');
    $clean = stripSecrets($data);
    $clean['id'] = $newId;
    $clean['registeredDate'] = $regDate;

    $pdo->prepare(
        'INSERT INTO career_registrations (id, full_name, phone, username, school, grade_attained, desired_course, home_area_parish, password_hash, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $clean['id'],
        $clean['fullName'],
        $clean['phone'],
        $clean['username'] ?? null,
        $clean['school'] ?? null,
        $clean['gradeAttained'] ?? null,
        $clean['desiredCourse'] ?? null,
        $clean['homeAreaParish'] ?? null,
        $passHash,
        json_encode($clean, JSON_UNESCAPED_UNICODE),
        $regDate,
    ]);

    $token = signToken(['role' => 'member', 'scope' => 'career-day', 'id' => $clean['id']], $tokenSecret);
    jsonOut(['registration' => $clean, 'token' => $token], 201);
}

if ($method === 'POST' && $route === 'matrons-patrons') {
    $data = readJsonBody();
    if (trim((string)($data['fullName'] ?? '')) === '' || trim((string)($data['phone'] ?? '')) === '') {
        jsonOut(['error' => 'Full name and phone number are required.'], 400);
    }
    $newId = nextSequentialId($pdo, 'matrons_patrons', 'ANIM-2027-', 3);
    $rawPass = trim((string)($data['password'] ?? ''));
    $passHash = $rawPass !== '' ? password_hash($rawPass, PASSWORD_DEFAULT) : null;
    $createdAt = (string)($data['commissionedDate'] ?? gmdate('Y-m-d'));
    $clean = stripSecrets($data);
    $clean['id'] = $newId;
    $clean['amountPaid'] = isset($data['amountPaid']) ? (float)$data['amountPaid'] : 100;

    $pdo->prepare(
        'INSERT INTO matrons_patrons (id, full_name, role, deanery_name, parish_name, local_church, phone, amount_paid, mpesa_code, password_hash, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $clean['id'],
        $clean['fullName'],
        $clean['role'] ?? 'Patron',
        $clean['deaneryName'] ?? null,
        $clean['parishName'] ?? null,
        $clean['localChurch'] ?? null,
        $clean['phone'],
        $clean['amountPaid'],
        $clean['mpesaCode'] ?? null,
        $passHash,
        json_encode($clean, JSON_UNESCAPED_UNICODE),
        $createdAt,
    ]);

    $token = signToken(['role' => 'member', 'scope' => 'matrons-patrons', 'id' => $clean['id']], $tokenSecret);
    jsonOut(['animator' => $clean, 'token' => $token], 201);
}

if ($method === 'POST' && $route === 'secondary-youth') {
    $data = readJsonBody();
    if (trim((string)($data['fullName'] ?? '')) === '' || trim((string)($data['phoneOrParentPhone'] ?? '')) === '') {
        jsonOut(['error' => 'Student name and phone are required.'], 400);
    }
    $newId = nextSequentialId($pdo, 'secondary_youth', 'SEC-2026-', 3);
    $regDate = gmdate('Y-m-d');
    $clean = $data;
    $clean['id'] = $newId;
    $clean['registrationDate'] = $regDate;

    $pdo->prepare(
        'INSERT INTO secondary_youth (id, full_name, school_name, form_level, phone_or_parent_phone, home_parish, home_deanery, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $clean['id'],
        $clean['fullName'],
        $clean['schoolName'] ?? '',
        $clean['formLevel'] ?? 'Form 1',
        $clean['phoneOrParentPhone'],
        $clean['homeParish'] ?? '',
        $clean['homeDeanery'] ?? '',
        json_encode($clean, JSON_UNESCAPED_UNICODE),
        $regDate,
    ]);

    jsonOut(['student' => $clean], 201);
}

// ---------------------------------------------------------------------------
// Authenticated Leader & Member Routes
// ---------------------------------------------------------------------------
if ($method === 'POST' && preg_match('#^leader/batches/([^/]+)/members$#', $route, $m)) {
    $batchId = $m[1];
    $session = verifyToken(getBearerHeader(), $tokenSecret);
    if (!$session || (($session['role'] ?? '') !== 'admin' && !(($session['role'] ?? '') === 'leader' && ($session['batchId'] ?? '') === $batchId))) {
        jsonOut(['error' => 'Leader or admin authorization required.'], 401);
    }

    $bStmt = $pdo->prepare('SELECT payload_json FROM parish_batches WHERE id = ? LIMIT 1');
    $bStmt->execute([$batchId]);
    $bRow = $bStmt->fetch();
    if (!$bRow) jsonOut(['error' => 'Parish batch not found.'], 404);
    $batch = json_decode((string)$bRow['payload_json'], true) ?: [];

    $body = readJsonBody();
    $fullName = trim((string)($body['fullName'] ?? ''));
    if ($fullName === '') jsonOut(['error' => 'Member full name is required.'], 400);

    $formattedId = nextSequentialId($pdo, 'youth_members', 'ADN-PRSH-2026-', 4);
    $now = gmdate('Y-m-d');
    $newMember = [
        'id' => $formattedId,
        'fullName' => $fullName,
        'gender' => (($body['gender'] ?? 'Male') === 'Female') ? 'Female' : 'Male',
        'dob' => '2004-01-01',
        'age' => (int)($body['age'] ?? 20),
        'phone' => (string)($body['phone'] ?? ($batch['leaderPhone'] ?? '')),
        'email' => preg_replace('/[^a-z0-9]/', '', strtolower($fullName)) . '@adn-youth.org',
        'deaneryId' => $batch['deaneryId'] ?? '',
        'parishId' => $batch['parishId'] ?? '',
        'subParish' => $batch['localChurch'] ?? '',
        'movement' => 'CYO',
        'occupation' => 'Parish Youth Member',
        'sacraments' => ['baptism' => true, 'firstCommunion' => true, 'confirmation' => false, 'matrimony' => false],
        'ministryGuild' => 'Youth Guild',
        'leadershipRole' => 'Member',
        'emergencyContact' => ['name' => $batch['leaderName'] ?? 'Leader', 'relation' => 'Youth Leader', 'phone' => $batch['leaderPhone'] ?? ''],
        'joinedDate' => $now,
        'status' => 'Active',
        'skills' => ['Parish Youth'],
        'approvalStatus' => 'Pending',
        'registeredByLeaderPhone' => $batch['leaderPhone'] ?? '',
        'registeredByLeaderName' => $batch['leaderName'] ?? '',
        'localChurch' => $batch['localChurch'] ?? '',
        'mpesaRef' => $batch['mpesaCode'] ?? 'ADDON',
        'registrationFee' => 100,
        'batchId' => $batchId,
        'deaneryName' => $batch['deaneryName'] ?? '',
        'parishName' => $batch['parishName'] ?? '',
    ];

    $batch['memberCount'] = (int)($batch['memberCount'] ?? 0) + 1;
    $batch['totalFee'] = $batch['memberCount'] * 100;
    $batch['memberIds'] = array_merge($batch['memberIds'] ?? [], [$formattedId]);

    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            'INSERT INTO youth_members (id, full_name, phone, movement, deanery_id, parish_id, deanery_name, parish_name, local_church, approval_status, batch_id, mpesa_ref, password_hash, payload_json, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $newMember['id'], $newMember['fullName'], $newMember['phone'], 'CYO',
            $newMember['deaneryId'], $newMember['parishId'], $newMember['deaneryName'], $newMember['parishName'],
            $newMember['localChurch'], 'Pending', $batchId, $newMember['mpesaRef'], null,
            json_encode($newMember, JSON_UNESCAPED_UNICODE), $now,
        ]);
        $pdo->prepare('UPDATE parish_batches SET member_count = ?, total_fee = ?, payload_json = ? WHERE id = ?')->execute([
            $batch['memberCount'], $batch['totalFee'], json_encode($batch, JSON_UNESCAPED_UNICODE), $batchId,
        ]);
        $pdo->commit();
        jsonOut(['member' => $newMember, 'batch' => stripSecrets($batch)], 201);
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonOut(['error' => 'Failed to add member to batch.'], 500);
    }
}

if ($method === 'PATCH' && preg_match('#^members/([^/]+)$#', $route, $m)) {
    $memberId = $m[1];
    $session = verifyToken(getBearerHeader(), $tokenSecret);
    $stmt = $pdo->prepare('SELECT payload_json FROM youth_members WHERE id = ? LIMIT 1');
    $stmt->execute([$memberId]);
    $row = $stmt->fetch();
    if (!$row) jsonOut(['error' => 'Member not found.'], 404);
    $existing = json_decode((string)$row['payload_json'], true) ?: [];

    $leaderOwns = $session && ($session['role'] ?? '') === 'leader'
        && ((($session['batchId'] ?? '') !== '' && ($existing['batchId'] ?? '') === $session['batchId'])
            || normalizePhone((string)($existing['registeredByLeaderPhone'] ?? '')) === normalizePhone((string)($session['leaderPhone'] ?? '')));

    if (!$session || (($session['role'] ?? '') !== 'admin' && !$leaderOwns)) {
        jsonOut(['error' => 'Authorization required to update member.'], 401);
    }

    $updates = stripSecrets(readJsonBody());
    if (($session['role'] ?? '') !== 'admin') {
        unset($updates['approvalStatus']);
    }
    $updated = array_merge($existing, $updates, ['id' => $memberId]);

    $pdo->prepare(
        'UPDATE youth_members SET full_name = ?, phone = ?, movement = ?, deanery_id = ?, parish_id = ?, deanery_name = ?, parish_name = ?, local_church = ?, approval_status = ?, payload_json = ? WHERE id = ?'
    )->execute([
        $updated['fullName'] ?? '',
        $updated['phone'] ?? '',
        $updated['movement'] ?? 'CYO',
        $updated['deaneryId'] ?? '',
        $updated['parishId'] ?? '',
        $updated['deaneryName'] ?? '',
        $updated['parishName'] ?? '',
        $updated['localChurch'] ?? ($updated['subParish'] ?? ''),
        $updated['approvalStatus'] ?? 'Confirmed',
        json_encode($updated, JSON_UNESCAPED_UNICODE),
        $memberId,
    ]);
    jsonOut(['member' => stripSecrets($updated)]);
}

if ($method === 'DELETE' && preg_match('#^members/([^/]+)$#', $route, $m)) {
    $memberId = $m[1];
    $session = verifyToken(getBearerHeader(), $tokenSecret);
    $stmt = $pdo->prepare('SELECT payload_json FROM youth_members WHERE id = ? LIMIT 1');
    $stmt->execute([$memberId]);
    $row = $stmt->fetch();
    if (!$row) jsonOut(['error' => 'Member not found.'], 404);
    $existing = json_decode((string)$row['payload_json'], true) ?: [];

    $leaderOwns = $session && ($session['role'] ?? '') === 'leader'
        && ((($session['batchId'] ?? '') !== '' && ($existing['batchId'] ?? '') === $session['batchId'])
            || normalizePhone((string)($existing['registeredByLeaderPhone'] ?? '')) === normalizePhone((string)($session['leaderPhone'] ?? '')));

    if (!$session || (($session['role'] ?? '') !== 'admin' && !$leaderOwns)) {
        jsonOut(['error' => 'Authorization required to delete member.'], 401);
    }
    $pdo->prepare('DELETE FROM youth_members WHERE id = ?')->execute([$memberId]);
    jsonOut(['ok' => true]);
}

// ---------------------------------------------------------------------------
// Events, Remittances, Vocations, Welfare
// ---------------------------------------------------------------------------
if ($method === 'POST' && preg_match('#^events/([^/]+)/toggle$#', $route, $m)) {
    $eventId = $m[1];
    $memberId = trim((string)(readJsonBody()['memberId'] ?? ''));
    if ($memberId === '') jsonOut(['error' => 'Member ID required.'], 400);
    $stmt = $pdo->prepare('SELECT payload_json FROM events WHERE id = ? LIMIT 1');
    $stmt->execute([$eventId]);
    $row = $stmt->fetch();
    if (!$row) jsonOut(['error' => 'Event not found.'], 404);
    $evt = json_decode((string)$row['payload_json'], true) ?: [];
    $reg = $evt['registeredMemberIds'] ?? [];
    if (in_array($memberId, $reg, true)) {
        $evt['registeredMemberIds'] = array_values(array_filter($reg, fn($id) => $id !== $memberId));
    } else {
        $evt['registeredMemberIds'][] = $memberId;
    }
    $pdo->prepare('UPDATE events SET payload_json = ? WHERE id = ?')->execute([json_encode($evt, JSON_UNESCAPED_UNICODE), $eventId]);
    jsonOut(['event' => $evt]);
}

if ($method === 'POST' && preg_match('#^events/([^/]+)/attend$#', $route, $m)) {
    $eventId = $m[1];
    $memberId = trim((string)(readJsonBody()['memberId'] ?? ''));
    if ($memberId === '') jsonOut(['error' => 'Member ID required.'], 400);
    $stmt = $pdo->prepare('SELECT payload_json FROM events WHERE id = ? LIMIT 1');
    $stmt->execute([$eventId]);
    $row = $stmt->fetch();
    if (!$row) jsonOut(['error' => 'Event not found.'], 404);
    $evt = json_decode((string)$row['payload_json'], true) ?: [];
    $att = $evt['attendedMemberIds'] ?? [];
    $marked = false;
    if (!in_array($memberId, $att, true)) {
        $marked = true;
        $evt['attendedMemberIds'][] = $memberId;
        if (!in_array($memberId, $evt['registeredMemberIds'] ?? [], true)) {
            $evt['registeredMemberIds'][] = $memberId;
        }
        $pdo->prepare('UPDATE events SET payload_json = ? WHERE id = ?')->execute([json_encode($evt, JSON_UNESCAPED_UNICODE), $eventId]);
    }
    jsonOut(['marked' => $marked, 'event' => $evt]);
}

if ($method === 'POST' && $route === 'remittances') {
    $data = readJsonBody();
    if (empty($data['parishId']) || empty($data['amount'])) jsonOut(['error' => 'Parish and amount required.'], 400);
    $id = 'rem-' . (string)round(microtime(true) * 1000);
    $receiptNo = 'REC-ADN-2026-' . (string)random_int(100, 999);
    $newRem = array_merge($data, ['id' => $id, 'receiptNo' => $receiptNo]);

    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            'INSERT INTO remittances (id, receipt_no, parish_id, deanery_id, amount, mpesa_ref, status, payload_json, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $id, $receiptNo, $newRem['parishId'], $newRem['deaneryId'] ?? '',
            (float)$newRem['amount'], $newRem['mpesaRef'] ?? '', $newRem['status'] ?? 'Pending Verification',
            json_encode($newRem, JSON_UNESCAPED_UNICODE), $newRem['date'] ?? gmdate('Y-m-d'),
        ]);
        if (($newRem['remittanceType'] ?? '') === 'Annual Archdiocesan Youth Levy') {
            $pStmt = $pdo->prepare('SELECT payload_json FROM parishes WHERE id = ? LIMIT 1');
            $pStmt->execute([$newRem['parishId']]);
            $pRow = $pStmt->fetch();
            if ($pRow) {
                $p = json_decode((string)$pRow['payload_json'], true) ?: [];
                $p['annualLevyPaid'] = (float)($p['annualLevyPaid'] ?? 0) + (float)$newRem['amount'];
                $pdo->prepare('UPDATE parishes SET annual_levy_paid = ?, payload_json = ? WHERE id = ?')->execute([
                    $p['annualLevyPaid'], json_encode($p, JSON_UNESCAPED_UNICODE), $p['id'],
                ]);
            }
        }
        $pdo->commit();
        jsonOut(['remittance' => $newRem], 201);
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonOut(['error' => 'Failed to record remittance.'], 500);
    }
}

if ($method === 'POST' && $route === 'vocations') {
    $data = readJsonBody();
    if (empty($data['aspirantName'])) jsonOut(['error' => 'Aspirant name required.'], 400);
    $id = 'voc-' . (string)round(microtime(true) * 1000);
    $dateRecorded = gmdate('Y-m-d');
    $newVoc = array_merge($data, ['id' => $id, 'dateRecorded' => $dateRecorded]);
    $pdo->prepare(
        'INSERT INTO vocations (id, member_id, aspirant_name, vocation_type, stage, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $id, $newVoc['memberId'] ?? '', $newVoc['aspirantName'], $newVoc['vocationType'] ?? '', $newVoc['stage'] ?? '',
        json_encode($newVoc, JSON_UNESCAPED_UNICODE), $dateRecorded,
    ]);
    jsonOut(['vocation' => $newVoc], 201);
}

if ($method === 'POST' && $route === 'welfare') {
    $data = readJsonBody();
    if (empty($data['memberName'])) jsonOut(['error' => 'Member name required.'], 400);
    $id = 'welf-' . (string)round(microtime(true) * 1000);
    $dateFiled = gmdate('Y-m-d');
    $newWelf = array_merge($data, ['id' => $id, 'dateFiled' => $dateFiled]);
    $pdo->prepare(
        'INSERT INTO welfare (id, member_id, member_name, category, status, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $id, $newWelf['memberId'] ?? '', $newWelf['memberName'], $newWelf['category'] ?? '', $newWelf['status'] ?? 'Open',
        json_encode($newWelf, JSON_UNESCAPED_UNICODE), $dateFiled,
    ]);
    jsonOut(['welfareCase' => $newWelf], 201);
}

// ---------------------------------------------------------------------------
// Admin-Only Routes
// ---------------------------------------------------------------------------
if ($method === 'POST' && preg_match('#^admin/parish-batches/([^/]+)/confirm$#', $route, $m)) {
    requireAdmin($tokenSecret);
    $batchId = $m[1];
    $adminName = (string)(readJsonBody()['adminName'] ?? 'Archdiocesan Youth Chaplaincy');
    $now = gmdate('Y-m-d');

    $bStmt = $pdo->prepare('SELECT payload_json FROM parish_batches WHERE id = ? LIMIT 1');
    $bStmt->execute([$batchId]);
    $bRow = $bStmt->fetch();
    if (!$bRow) jsonOut(['error' => 'Batch not found.'], 404);
    $batch = json_decode((string)$bRow['payload_json'], true) ?: [];
    $batch['approvalStatus'] = 'Confirmed';
    $batch['paymentStatus'] = 'Verified';
    $batch['approvedBy'] = $adminName;
    $batch['approvedAt'] = $now;

    $pdo->beginTransaction();
    try {
        $pdo->prepare('UPDATE parish_batches SET approval_status = ?, payload_json = ? WHERE id = ?')->execute([
            'Confirmed', json_encode($batch, JSON_UNESCAPED_UNICODE), $batchId,
        ]);
        $mStmt = $pdo->prepare('SELECT id, payload_json FROM youth_members WHERE batch_id = ?');
        $mStmt->execute([$batchId]);
        $upd = $pdo->prepare('UPDATE youth_members SET approval_status = ?, payload_json = ? WHERE id = ?');
        while ($mr = $mStmt->fetch()) {
            $mem = json_decode((string)$mr['payload_json'], true) ?: [];
            $mem['approvalStatus'] = 'Confirmed';
            $upd->execute(['Confirmed', json_encode($mem, JSON_UNESCAPED_UNICODE), $mr['id']]);
        }
        $pdo->commit();
        jsonOut(['ok' => true, 'batch' => stripSecrets($batch)]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonOut(['error' => 'Failed to confirm batch.'], 500);
    }
}

if ($method === 'POST' && preg_match('#^admin/members/([^/]+)/confirm$#', $route, $m)) {
    requireAdmin($tokenSecret);
    $memberId = $m[1];
    $stmt = $pdo->prepare('SELECT payload_json FROM youth_members WHERE id = ? LIMIT 1');
    $stmt->execute([$memberId]);
    $row = $stmt->fetch();
    if (!$row) jsonOut(['error' => 'Member not found.'], 404);
    $mem = json_decode((string)$row['payload_json'], true) ?: [];
    $mem['approvalStatus'] = 'Confirmed';
    $pdo->prepare('UPDATE youth_members SET approval_status = ?, payload_json = ? WHERE id = ?')->execute([
        'Confirmed', json_encode($mem, JSON_UNESCAPED_UNICODE), $memberId,
    ]);
    jsonOut(['ok' => true, 'member' => stripSecrets($mem)]);
}

if ($method === 'POST' && preg_match('#^admin/challenge-teams/([^/]+)/confirm$#', $route, $m)) {
    requireAdmin($tokenSecret);
    $teamId = $m[1];
    $adminName = (string)(readJsonBody()['adminName'] ?? 'Archdiocesan Youth Chaplaincy');
    $now = gmdate('Y-m-d');
    $stmt = $pdo->prepare('SELECT payload_json FROM challenge_teams WHERE id = ? LIMIT 1');
    $stmt->execute([$teamId]);
    $row = $stmt->fetch();
    if (!$row) jsonOut(['error' => 'Challenge team not found.'], 404);
    $team = json_decode((string)$row['payload_json'], true) ?: [];
    $team['paymentStatus'] = 'Confirmed';
    $team['approvedBy'] = $adminName;
    $team['approvedAt'] = $now;
    unset($team['rejectedReason']);
    $pdo->prepare('UPDATE challenge_teams SET payment_status = ?, payload_json = ? WHERE id = ?')->execute([
        'Confirmed', json_encode($team, JSON_UNESCAPED_UNICODE), $teamId,
    ]);
    jsonOut(['ok' => true, 'team' => stripSecrets($team)]);
}

if ($method === 'POST' && preg_match('#^admin/challenge-teams/([^/]+)/reject$#', $route, $m)) {
    requireAdmin($tokenSecret);
    $teamId = $m[1];
    $reason = (string)(readJsonBody()['reason'] ?? 'M-Pesa payment could not be verified.');
    $stmt = $pdo->prepare('SELECT payload_json FROM challenge_teams WHERE id = ? LIMIT 1');
    $stmt->execute([$teamId]);
    $row = $stmt->fetch();
    if (!$row) jsonOut(['error' => 'Challenge team not found.'], 404);
    $team = json_decode((string)$row['payload_json'], true) ?: [];
    $team['paymentStatus'] = 'Rejected';
    $team['rejectedReason'] = $reason;
    $pdo->prepare('UPDATE challenge_teams SET payment_status = ?, payload_json = ? WHERE id = ?')->execute([
        'Rejected', json_encode($team, JSON_UNESCAPED_UNICODE), $teamId,
    ]);
    jsonOut(['ok' => true, 'team' => stripSecrets($team)]);
}

if ($method === 'PATCH' && preg_match('#^admin/challenge-teams/([^/]+)$#', $route, $m)) {
    requireAdmin($tokenSecret);
    $teamId = $m[1];
    $stmt = $pdo->prepare('SELECT payload_json FROM challenge_teams WHERE id = ? LIMIT 1');
    $stmt->execute([$teamId]);
    $row = $stmt->fetch();
    if (!$row) jsonOut(['error' => 'Challenge team not found.'], 404);
    $existing = json_decode((string)$row['payload_json'], true) ?: [];
    $updated = array_merge($existing, stripSecrets(readJsonBody()), ['id' => $teamId]);
    $pdo->prepare('UPDATE challenge_teams SET payment_status = ?, payload_json = ? WHERE id = ?')->execute([
        $updated['paymentStatus'] ?? 'Pending Verification', json_encode($updated, JSON_UNESCAPED_UNICODE), $teamId,
    ]);
    jsonOut(['ok' => true, 'team' => stripSecrets($updated)]);
}

if ($method === 'DELETE' && preg_match('#^admin/nicca/([^/]+)$#', $route, $m)) {
    requireAdmin($tokenSecret);
    $pdo->prepare('DELETE FROM nicca_students WHERE id = ?')->execute([$m[1]]);
    jsonOut(['ok' => true]);
}

if ($method === 'DELETE' && preg_match('#^admin/career-day/([^/]+)$#', $route, $m)) {
    requireAdmin($tokenSecret);
    $pdo->prepare('DELETE FROM career_registrations WHERE id = ?')->execute([$m[1]]);
    jsonOut(['ok' => true]);
}

if ($method === 'DELETE' && preg_match('#^admin/matrons-patrons/([^/]+)$#', $route, $m)) {
    requireAdmin($tokenSecret);
    $pdo->prepare('DELETE FROM matrons_patrons WHERE id = ?')->execute([$m[1]]);
    jsonOut(['ok' => true]);
}

if ($method === 'DELETE' && preg_match('#^admin/secondary-youth/([^/]+)$#', $route, $m)) {
    requireAdmin($tokenSecret);
    $pdo->prepare('DELETE FROM secondary_youth WHERE id = ?')->execute([$m[1]]);
    jsonOut(['ok' => true]);
}

if ($method === 'POST' && preg_match('#^admin/remittances/([^/]+)/verify$#', $route, $m)) {
    requireAdmin($tokenSecret);
    $id = $m[1];
    $verifiedBy = (string)(readJsonBody()['verifiedBy'] ?? 'Archdiocesan Finance Office');
    $stmt = $pdo->prepare('SELECT payload_json FROM remittances WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) jsonOut(['error' => 'Remittance not found.'], 404);
    $rem = json_decode((string)$row['payload_json'], true) ?: [];
    $rem['status'] = 'Verified';
    $rem['verifiedBy'] = $verifiedBy;
    $pdo->prepare('UPDATE remittances SET status = ?, payload_json = ? WHERE id = ?')->execute(['Verified', json_encode($rem, JSON_UNESCAPED_UNICODE), $id]);
    jsonOut(['ok' => true, 'remittance' => $rem]);
}

if ($method === 'PATCH' && preg_match('#^admin/vocations/([^/]+)$#', $route, $m)) {
    requireAdmin($tokenSecret);
    $id = $m[1];
    $stmt = $pdo->prepare('SELECT payload_json FROM vocations WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) jsonOut(['error' => 'Vocation not found.'], 404);
    $v = json_decode((string)$row['payload_json'], true) ?: [];
    $body = readJsonBody();
    if (!empty($body['stage'])) $v['stage'] = $body['stage'];
    $pdo->prepare('UPDATE vocations SET stage = ?, payload_json = ? WHERE id = ?')->execute([$v['stage'], json_encode($v, JSON_UNESCAPED_UNICODE), $id]);
    jsonOut(['ok' => true, 'vocation' => $v]);
}

if ($method === 'PATCH' && preg_match('#^admin/welfare/([^/]+)$#', $route, $m)) {
    requireAdmin($tokenSecret);
    $id = $m[1];
    $stmt = $pdo->prepare('SELECT payload_json FROM welfare WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) jsonOut(['error' => 'Welfare case not found.'], 404);
    $w = json_decode((string)$row['payload_json'], true) ?: [];
    $body = readJsonBody();
    if (!empty($body['status'])) $w['status'] = $body['status'];
    if (isset($body['amountDisbursed'])) $w['amountDisbursed'] = (float)$body['amountDisbursed'];
    $pdo->prepare('UPDATE welfare SET status = ?, payload_json = ? WHERE id = ?')->execute([$w['status'], json_encode($w, JSON_UNESCAPED_UNICODE), $id]);
    jsonOut(['ok' => true, 'welfareCase' => $w]);
}

if ($method === 'POST' && $route === 'admin/parishes') {
    requireAdmin($tokenSecret);
    $data = readJsonBody();
    if (empty($data['name']) || empty($data['deaneryId'])) jsonOut(['error' => 'Parish name and deanery required.'], 400);
    $id = 'parish-' . (string)round(microtime(true) * 1000);
    $parish = array_merge($data, ['id' => $id]);
    $pdo->prepare('INSERT INTO parishes (id, name, deanery_id, annual_levy_paid, payload_json) VALUES (?, ?, ?, ?, ?)')->execute([
        $id, $parish['name'], $parish['deaneryId'], (float)($parish['annualLevyPaid'] ?? 0), json_encode($parish, JSON_UNESCAPED_UNICODE),
    ]);
    jsonOut(['parish' => $parish], 201);
}

if ($method === 'PATCH' && preg_match('#^admin/parishes/([^/]+)$#', $route, $m)) {
    requireAdmin($tokenSecret);
    $id = $m[1];
    $stmt = $pdo->prepare('SELECT payload_json FROM parishes WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) jsonOut(['error' => 'Parish not found.'], 404);
    $existing = json_decode((string)$row['payload_json'], true) ?: [];
    $updated = array_merge($existing, readJsonBody(), ['id' => $id]);
    $pdo->prepare('UPDATE parishes SET name = ?, deanery_id = ?, annual_levy_paid = ?, payload_json = ? WHERE id = ?')->execute([
        $updated['name'], $updated['deaneryId'], (float)($updated['annualLevyPaid'] ?? 0), json_encode($updated, JSON_UNESCAPED_UNICODE), $id,
    ]);
    jsonOut(['parish' => $updated]);
}

if ($method === 'POST' && $route === 'admin/events') {
    requireAdmin($tokenSecret);
    $data = readJsonBody();
    if (empty($data['title'])) jsonOut(['error' => 'Event title required.'], 400);
    $id = 'evt-' . (string)round(microtime(true) * 1000);
    $evt = array_merge($data, ['id' => $id, 'registeredMemberIds' => [], 'attendedMemberIds' => []]);
    $pdo->prepare('INSERT INTO events (id, title, scope, start_date, status, payload_json) VALUES (?, ?, ?, ?, ?, ?)')->execute([
        $id, $evt['title'], $evt['scope'] ?? 'Archdiocesan', $evt['startDate'] ?? '', $evt['status'] ?? 'Upcoming', json_encode($evt, JSON_UNESCAPED_UNICODE),
    ]);
    jsonOut(['event' => $evt], 201);
}

if ($method === 'PATCH' && preg_match('#^admin/events/([^/]+)$#', $route, $m)) {
    requireAdmin($tokenSecret);
    $id = $m[1];
    $stmt = $pdo->prepare('SELECT payload_json FROM events WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) jsonOut(['error' => 'Event not found.'], 404);
    $existing = json_decode((string)$row['payload_json'], true) ?: [];
    $updated = array_merge($existing, readJsonBody(), ['id' => $id]);
    $pdo->prepare('UPDATE events SET title = ?, scope = ?, start_date = ?, status = ?, payload_json = ? WHERE id = ?')->execute([
        $updated['title'], $updated['scope'], $updated['startDate'], $updated['status'], json_encode($updated, JSON_UNESCAPED_UNICODE), $id,
    ]);
    jsonOut(['event' => $updated]);
}

if ($method === 'POST' && $route === 'admin/reset') {
    requireAdmin($tokenSecret);
    foreach (['youth_members', 'parish_batches', 'parish_leaders', 'nicca_students', 'challenge_teams', 'career_registrations', 'matrons_patrons', 'secondary_youth', 'events', 'remittances', 'vocations', 'welfare'] as $tbl) {
        $pdo->exec("DELETE FROM {$tbl}");
    }
    jsonOut(['ok' => true, 'state' => getAllState($pdo, $configAdminPass)]);
}

jsonOut(['error' => 'API endpoint not found.'], 404);

<?php
// Copy this file to config.php on your HostPinnacle server (public_html/api/config.php)
// and fill in your cPanel MySQL database details.
// Do NOT commit config.php to GitHub.

return [
    'DB_HOST' => 'localhost',
    'DB_NAME' => '',      // e.g. yourcpanel_adnyouth
    'DB_USER' => '',      // e.g. yourcpanel_dbuser
    'DB_PASS' => '',      // your MySQL user password
    'ADMIN_USERNAME' => 'admin',
    // Optional: set a fixed admin passcode here, or leave blank to set it via the First-Run Admin Setup screen.
    'ADMIN_PASSCODE' => '',
    // Generate a random 64-character hex string for signing session tokens:
    'TOKEN_SECRET' => '',
];

HostPinnacle MySQL + PHP Database Setup Guide
=============================================

1. In HostPinnacle cPanel -> MySQL Databases:
   - Create a new MySQL database (e.g. yourcpanel_adnyouth)
   - Create a MySQL user and password
   - Add the user to the database with ALL PRIVILEGES

2. In HostPinnacle cPanel -> phpMyAdmin:
   - Select your new database
   - Click "Import" and upload api/schema.sql

3. In HostPinnacle cPanel -> File Manager (public_html/api/):
   - Copy config.example.php to config.php
   - Edit config.php and fill in DB_NAME, DB_USER, DB_PASS, and a random TOKEN_SECRET
   - (Optional) Set ADMIN_PASSCODE or leave blank to set your Admin password on first login
   - Keep config.php on the server so future dist/ deployments never overwrite it

4. Open https://system.quovadisyouthhub.org and register/login!

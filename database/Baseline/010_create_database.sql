DROP DATABASE IF EXISTS power_scripture_baseline;

CREATE DATABASE power_scripture_baseline
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE power_scripture_baseline;

CREATE USER 'power_scripture_app'@'127.0.0.1'
IDENTIFIED WITH mysql_native_password
BY 'change_this_password';

GRANT
  SELECT,
  INSERT,
  UPDATE,
  DELETE,
  EXECUTE,
  CREATE TEMPORARY TABLES
ON `power\_scripture\_%`.*
TO 'power_scripture_app'@'127.0.0.1';

FLUSH PRIVILEGES;
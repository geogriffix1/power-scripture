# The power_scripture_app user is created as part of the MySql installation
# It can only be created one time. It can perform on all databases
# with names beginning with power_scripture_

CREATE USER 'power_scripture_app'@'localhost'
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
TO 'power_scripture_app'@'localhost';

FLUSH PRIVILEGES;DROP DATABASE IF EXISTS power_scripture_baseline;


# This creates a database called power_scripture_baseline
# with full functionality but minimal data preloaded.

CREATE DATABASE power_scripture_baseline
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
  
USE power_scripture_baseline;

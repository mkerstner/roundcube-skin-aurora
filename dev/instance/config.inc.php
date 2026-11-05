<?php

// AURORA-DEV-INSTANCE — throwaway config for the local Docker test instance.
// start.sh copies this over the container's copy of config/config.inc.php; the
// host's real config is never read. Nothing here is a real secret.

$config = [];

// Database: SQLite inside the container, recreated on every start
$config['db_dsnw'] = 'sqlite:////work/temp/aurora-dev.db?mode=0646';

// GreenMail (authentication disabled; preloaded test mailbox)
$config['imap_host'] = 'mailhost:3143';
$config['smtp_host'] = 'mailhost:3025';
$config['smtp_user'] = '';
$config['smtp_pass'] = '';

// 24 characters, dev-only
$config['des_key'] = 'aurora-dev-only-key-24ch';

$config['skin'] = 'aurora';
$config['language'] = 'en_US';
// Comma-separated plugin list from the environment, empty by default:
//   AURORA_DEV_PLUGINS=acl,help docker compose -f compose.yaml up -d
$config['plugins'] = array_values(array_filter(explode(',', (string) getenv('AURORA_DEV_PLUGINS'))));

$config['temp_dir'] = '/work/temp/';
$config['log_dir'] = '/work/logs/';
$config['create_default_folders'] = true;
$config['product_name'] = 'Aurora dev';
$config['enable_installer'] = false;

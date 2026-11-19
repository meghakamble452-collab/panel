<?php
declare(strict_types=1);
define('DB_HOST','127.0.0.1');
define('DB_NAME','express_panel');
define('DB_USER','express');
define('DB_PASS','Ty04JfijwAnQc7rmMHLbKkq5');
define('BASE_URL','https://expressts.co.in');
define('FILE_BASE', BASE_URL.'/api/files');
define('SEP','|--|');

function db(): PDO {
  static $p = null;
  if (!$p) $p = new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',
    DB_USER, DB_PASS, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
                       PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
  $p->exec("SET NAMES utf8mb4");
  return $p;
}
function out(string $s): void { header('Content-Type: text/plain; charset=utf-8'); echo $s; exit; }
function setting(string $k, string $d=''): string {
  $st = db()->prepare('SELECT v FROM settings WHERE k=?'); $st->execute([$k]);
  $r = $st->fetchColumn(); return $r===false||$r===null ? $d : (string)$r;
}

<?php
require __DIR__.'/config.php';
header('Content-Type: text/plain; charset=utf-8');
$rows = db()->query("SELECT v FROM settings WHERE k='proxy_list'")->fetchColumn();
echo $rows ?: '';
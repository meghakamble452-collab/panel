<?php
require __DIR__.'/guard.php';
need();
if (isset($_GET['local'])) {
  $f = __DIR__.'/files/Express.zip';
  if (!file_exists($f)) { http_response_code(404); exit('Express.zip not uploaded'); }
  header('Content-Type: application/zip');
  header('Content-Disposition: attachment; filename="Express.zip"');
  header('Content-Length: '.filesize($f));
  readfile($f);
  exit;
}
header('Location: https://gofile.io/d/2XBWphu5', true, 302);
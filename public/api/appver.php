<?php
require __DIR__.'/guard.php';
$u = need();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  if (($u['role'] ?? '') !== 'developer') jj(['error' => 'Sirf developer version badal sakta hai'], 403);
  $b = json_decode(file_get_contents('php://input'), true) ?: [];
  $v = trim((string)($b['version'] ?? ''));
  if (!preg_match('/^\d+(\.\d+){1,3}$/', $v))
    jj(['error' => 'Version 1.0.0.0 jaisa hona chahiye'], 422);

  $ex = db()->prepare('SELECT 1 FROM settings WHERE k=? LIMIT 1');
  $ex->execute(['app_version']);
  if ($ex->fetch()) db()->prepare('UPDATE settings SET v=? WHERE k=?')->execute([$v, 'app_version']);
  else db()->prepare('INSERT INTO settings (k,v) VALUES (?,?)')->execute(['app_version', $v]);

  logAct($u, 'app_version', null, $v, 'setting', 'app version change');
  jj(['ok' => true, 'version' => $v]);
}

jj(['version' => setting('app_version', '1.0.0.0')]);
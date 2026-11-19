<?php
require __DIR__.'/guard.php';
$u = need(); $ids = subIds($u);
$w = $ids ? 'owner_id IN ('.implode(',', $ids).')' : '1';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_GET['action'])) {
  $b = json_decode(file_get_contents('php://input'), true) ?: [];
  $cnt = max(1, min(50, (int)($b['count'] ?? 1)));
  $days = max(1, min(3650, (int)($b['days'] ?? 30)));
  $pre = strtoupper(preg_replace('/[^A-Za-z]/', '', $b['prefix'] ?? 'EXP'));
  if ($pre === '') $pre = 'EXP';
  $made = [];
  $st = db()->prepare('INSERT INTO users (keycode,db_pass,days_left,key_type,paid,owner_id,created_by) VALUES (?,?,?,?,?,?,?)');
  for ($i = 0; $i < $cnt; $i++) {
    $key = substr($pre.strtoupper(bin2hex(random_bytes(5))), 0, 12);
    $st->execute([$key, substr($key, 0, 3), $days, 'PAID', 1, (int)$u['id'], (int)$u['id']]);
    $made[] = $key;
  }
  jj(['ok'=>true,'keys'=>$made]);
}
if (isset($_GET['action'])) {
  $a = $_GET['action']; $id = (int)($_GET['id'] ?? 0);
  switch ($a) {
    case 'deactivate': db()->prepare('UPDATE users SET active=0 WHERE id=?')->execute([$id]); break;
    case 'activate':   db()->prepare('UPDATE users SET active=1 WHERE id=?')->execute([$id]); break;
    case 'paid':       db()->prepare('UPDATE users SET paid=1 WHERE id=?')->execute([$id]); break;
    case 'resetmac':   db()->prepare('UPDATE users SET mac=NULL WHERE id=?')->execute([$id]); break;
    case 'adddays':    db()->prepare('UPDATE users SET days_left=days_left+? WHERE id=?')->execute([max(1,(int)($_GET['days'] ?? 30)), $id]); break;
    case 'delete':
      db()->prepare('UPDATE users SET deleted_at=NOW(), deleted_by=? WHERE id=?')->execute([(int)$u['id'], $id]);
      db()->prepare('INSERT INTO paid_records (user_id,keycode,amount,master_id) SELECT id,keycode,0,owner_id FROM users WHERE id=?')->execute([$id]);
      break;
    case 'deactivateall': db()->exec("UPDATE users SET active=0 WHERE deleted_at IS NULL AND $w"); break;
    case 'activateall':   db()->exec("UPDATE users SET active=1 WHERE deleted_at IS NULL AND $w"); break;
    case 'resetall':      db()->exec("UPDATE users SET mac=NULL WHERE deleted_at IS NULL AND $w"); break;
    case 'deleteunpaid':  db()->exec("UPDATE users SET deleted_at=NOW() WHERE deleted_at IS NULL AND paid=0 AND $w"); break;
  }
  jj(['ok'=>true]);
}
$q = '%'.trim((string)($_GET['q'] ?? '')).'%';
$st = db()->prepare("SELECT id,keycode,mac,days_left,active,paid,last_ip FROM users
  WHERE deleted_at IS NULL AND $w AND (keycode LIKE ? OR mac LIKE ?) ORDER BY id DESC LIMIT 300");
$st->execute([$q, $q]);
jj($st->fetchAll());
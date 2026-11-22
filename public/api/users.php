<?php
require __DIR__.'/guard.php';
$u = need(); $ids = subIds($u);
$w = $ids ? 'owner_id IN ('.implode(',', $ids).')' : '1';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_GET['action'])) {
  $b    = json_decode(file_get_contents('php://input'), true) ?: [];
  $days = max(1, min(3650, (int)($b['days'] ?? 30)));
  $key  = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string)($b['key'] ?? '')));
  $len  = strlen($key);

  if ($len < 10 || $len > 20)
    jj(['error' => 'Key 10 se 20 character ke beech honi chahiye (aapne '.$len.' diye)'], 422);

  $chk = db()->prepare('SELECT id FROM users WHERE keycode = ? LIMIT 1');
  $chk->execute([$key]);
  if ($chk->fetch()) jj(['error' => 'This key already exists. Please try a new key.'], 409);

  db()->prepare('INSERT INTO users (keycode,db_pass,days_left,key_type,paid,owner_id,created_by) VALUES (?,?,?,?,?,?,?)')
      ->execute([$key, substr($key, 0, 3), $days, 'PAID', 1, (int)$u['id'], (int)$u['id']]);

  logAct($u, 'key_gen', null, $key, 'user', $days.' din validity');
  jj(['ok'=>true, 'keys'=>[$key]]);
}
if (isset($_GET['action'])) {
  $a = $_GET['action']; $id = (int)($_GET['id'] ?? 0);
  if (!in_array($a, ['deactivateall','activateall','resetall','deleteunpaid'], true)) {
    $st = db()->prepare('SELECT keycode,owner_id FROM users WHERE id=? LIMIT 1');
    $st->execute([$id]); $t = $st->fetch();
    if (!$t) jj(['error'=>'Key nahi mili'], 404);
    if (!inScope($ids, (int)$t['owner_id'])) jj(['error'=>'Aapka access nahi'], 403);
  }
  switch ($a) {
    case 'deactivate': db()->prepare('UPDATE users SET active=0 WHERE id=?')->execute([$id]); logAct($u,'key_off',$id,$t['keycode'],'user'); break;
    case 'activate':   db()->prepare('UPDATE users SET active=1 WHERE id=?')->execute([$id]); logAct($u,'key_on',$id,$t['keycode'],'user'); break;
    case 'paid':       db()->prepare('UPDATE users SET paid=1 WHERE id=?')->execute([$id]); logAct($u,'key_paid',$id,$t['keycode'],'user'); break;
    case 'resetmac':   db()->prepare('UPDATE users SET mac=NULL WHERE id=?')->execute([$id]); logAct($u,'key_mac',$id,$t['keycode'],'user'); break;
    case 'adddays':    $d = max(1,(int)($_GET['days'] ?? 30)); db()->prepare('UPDATE users SET days_left=days_left+? WHERE id=?')->execute([$d, $id]); logAct($u,'key_days',$id,$t['keycode'],'user',"+$d din"); break;
    case 'delete':
      try { db()->prepare('UPDATE users SET deleted_at=NOW(), deleted_by=? WHERE id=?')->execute([(int)$u['id'], $id]); }
      catch (Throwable $e) { db()->prepare('UPDATE users SET deleted_at=NOW() WHERE id=?')->execute([$id]); }
      try { db()->prepare('INSERT INTO paid_records (user_id,keycode,amount,master_id) SELECT id,keycode,0,owner_id FROM users WHERE id=?')->execute([$id]); } catch (Throwable $e) {}
      logAct($u,'key_del',$id,$t['keycode'],'user','key delete');
      break;
    case 'deactivateall': db()->exec("UPDATE users SET active=0 WHERE deleted_at IS NULL AND $w"); logAct($u,'bulk_off'); break;
    case 'activateall':   db()->exec("UPDATE users SET active=1 WHERE deleted_at IS NULL AND $w"); logAct($u,'bulk_on'); break;
    case 'resetall':      db()->exec("UPDATE users SET mac=NULL WHERE deleted_at IS NULL AND $w"); logAct($u,'bulk_mac'); break;
    case 'deleteunpaid':  db()->exec("UPDATE users SET deleted_at=NOW() WHERE deleted_at IS NULL AND paid=0 AND $w"); logAct($u,'bulk_del_unpaid'); break;
  }
  jj(['ok'=>true]);
}
$q = '%'.trim((string)($_GET['q'] ?? '')).'%';
$st = db()->prepare("SELECT id,keycode,mac,days_left,active,paid,last_ip FROM users
  WHERE deleted_at IS NULL AND $w AND (keycode LIKE ? OR mac LIKE ?) ORDER BY id DESC LIMIT 300");
$st->execute([$q, $q]);
jj($st->fetchAll());
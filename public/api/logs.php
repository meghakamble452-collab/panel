<?php
require __DIR__.'/guard.php';
$u = need(); $ids = subIds($u);
$id = (int)($_GET['id'] ?? 0);
if ($id && !inScope($ids, $id)) jj(['error'=>'Aapka access nahi'], 403);
if ($id) {
  $st = db()->prepare('SELECT l.*, a.username actor FROM admin_logs l LEFT JOIN admins a ON a.id=l.actor_id
    WHERE l.actor_id=? ORDER BY l.id DESC LIMIT 200');
  $st->execute([$id]);
} else {
  $sc = $ids ? ' WHERE l.actor_id IN ('.implode(',', $ids).')' : '';
  $st = db()->query('SELECT l.*, a.username actor FROM admin_logs l LEFT JOIN admins a ON a.id=l.actor_id'.$sc.' ORDER BY l.id DESC LIMIT 200');
}
jj($st->fetchAll());
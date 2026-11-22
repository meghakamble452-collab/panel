<?php
require __DIR__.'/guard.php';
$u = need(); $ids = subIds($u);
$q  = '%'.trim((string)($_GET['q'] ?? '')).'%';
$by = trim((string)($_GET['by'] ?? ''));

$where = ['x.deleted_at IS NOT NULL'];
if ($ids) $where[] = 'x.owner_id IN ('.implode(',', $ids).')';

if ($by === 'me') {
  $where[] = 'dl.actor_id = '.(int)$u['id'];
} elseif (ctype_digit($by) && (int)$by > 0) {
  $bid = (int)$by;
  if (!inScope($ids, $bid) && $bid !== (int)$u['id']) jj(['error'=>'Aapka access nahi'], 403);
  $where[] = 'dl.actor_id = '.$bid;
}

$sql = "SELECT x.id,x.keycode,x.mac,x.days_left,x.paid,x.deleted_at,x.owner_id,
  s.username seller, a.username admin, m.username master, sm.username super_name,
  dl.actor_id deleted_by_id, dlu.username deleted_by, dlu.role deleted_by_role
  FROM users x
  LEFT JOIN admins s  ON s.id  = x.owner_id
  LEFT JOIN admins a  ON a.id  = s.parent_id
  LEFT JOIN admins m  ON m.id  = a.parent_id
  LEFT JOIN admins sm ON sm.id = m.parent_id
  LEFT JOIN admin_logs dl ON dl.id = (
      SELECT l2.id FROM admin_logs l2
      WHERE l2.action = 'key_del' AND l2.target_id = x.id
      ORDER BY l2.id DESC LIMIT 1)
  LEFT JOIN admins dlu ON dlu.id = dl.actor_id
  WHERE ".implode(' AND ', $where)."
  AND (x.keycode LIKE ? OR x.mac LIKE ?)
  ORDER BY x.deleted_at DESC LIMIT 300";

$st = db()->prepare($sql); $st->execute([$q, $q]);
jj($st->fetchAll());
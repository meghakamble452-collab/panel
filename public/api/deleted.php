<?php
require __DIR__.'/guard.php';
$u = need(); $ids = subIds($u);
$q = '%'.trim((string)($_GET['q'] ?? '')).'%';
$st = db()->prepare("SELECT x.id,x.keycode,x.days_left,x.paid,x.deleted_at,
  s.username seller, a.username admin, m.username master, sm.username super_name
  FROM users x
  LEFT JOIN admins s ON s.id=x.owner_id
  LEFT JOIN admins a ON a.id=s.parent_id
  LEFT JOIN admins m ON m.id=a.parent_id
  LEFT JOIN admins sm ON sm.id=m.parent_id
  WHERE x.deleted_at IS NOT NULL".($ids ? ' AND x.owner_id IN ('.implode(',', $ids).')' : '').'
  AND (x.keycode LIKE ? OR x.mac LIKE ?) ORDER BY x.deleted_at DESC LIMIT 300");
$st->execute([$q, $q]); jj($st->fetchAll());
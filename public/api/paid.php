<?php
require __DIR__.'/guard.php';
need();
$q = '%'.trim((string)($_GET['q'] ?? '')).'%';
$st = db()->prepare("SELECT p.id,p.keycode,p.created_at,m.username master,sm.username super_name
  FROM paid_records p LEFT JOIN admins m ON m.id=p.master_id
  LEFT JOIN admins sm ON sm.id=m.parent_id
  WHERE p.keycode LIKE ? ORDER BY p.id DESC LIMIT 300");
$st->execute([$q]); jj($st->fetchAll());
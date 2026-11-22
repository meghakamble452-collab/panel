<?php
require __DIR__.'/guard.php';
$u = need(); $ids = subIds($u);

$rows = $ids
  ? db()->query('SELECT id,username,role FROM admins WHERE id IN ('.implode(',', $ids).') ORDER BY role, username')->fetchAll()
  : db()->query('SELECT id,username,role FROM admins ORDER BY role, username')->fetchAll();

$out = [['id'=>(int)$u['id'], 'username'=>$u['username'], 'role'=>$u['role'], 'me'=>true]];
foreach ($rows as $r) { $r['me'] = false; $out[] = $r; }
jj($out);
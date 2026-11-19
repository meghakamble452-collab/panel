<?php
require __DIR__.'/guard.php';
$u = need(); $ids = subIds($u);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_GET['action'])) {
  $b = json_decode(file_get_contents('php://input'), true) ?: [];
  $un = trim((string)($b['username'] ?? '')); $pw = (string)($b['password'] ?? '');
  $role = in_array($b['role'] ?? '', ['super_master','master','admin','seller'], true) ? $b['role'] : 'seller';
  if ($un === '' || strlen($pw) < 4) jj(['error'=>'Username/password chhota hai'], 422);
  try {
    db()->prepare('INSERT INTO admins (username,pass_hash,pass_plain,role,parent_id,per_id_rate) VALUES (?,?,?,?,?,?)')
        ->execute([$un, password_hash($pw, PASSWORD_BCRYPT), $pw, $role, (int)$u['id'], (float)($b['rate'] ?? 500)]);
  } catch (PDOException $e) { jj(['error'=>'Username already exists'], 409); }
  jj(['ok'=>true]);
}
if (isset($_GET['action'])) {
  $id = (int)($_GET['id'] ?? 0);
  if ($_GET['action'] === 'activate') db()->prepare('UPDATE admins SET status="active" WHERE id=?')->execute([$id]);
  if ($_GET['action'] === 'block')    db()->prepare('UPDATE admins SET status="blocked" WHERE id=?')->execute([$id]);
  if ($_GET['action'] === 'delete')   db()->prepare('DELETE FROM admins WHERE id=?')->execute([$id]);
  if ($_GET['action'] === 'setpass') { db()->prepare('UPDATE admins SET pass_plain=?, pass_hash=? WHERE id=?')->execute([$_GET['p'], password_hash($_GET['p'], PASSWORD_BCRYPT), $id]); }
  jj(['ok'=>true]);
}
$rows = db()->query('SELECT a.id,a.username,a.pass_plain,a.role,a.status,a.per_id_rate,a.payment_due,
  COALESCE(p.username,"-") admin,
  (SELECT COUNT(*) FROM users x WHERE x.owner_id=a.id AND x.deleted_at IS NULL AND DATE(x.created_at)=CURDATE()) today_sold,
  (SELECT COUNT(*) FROM users x WHERE x.owner_id=a.id AND x.deleted_at IS NULL) total_sold,
  (SELECT COUNT(*) FROM users x WHERE x.owner_id=a.id AND x.deleted_at IS NULL AND x.active=1) active_sold,
  (SELECT COUNT(*) FROM users x WHERE x.owner_id=a.id AND x.deleted_at IS NULL AND x.created_at>=DATE_SUB(NOW(),INTERVAL 7 DAY)) weekly_sale,
  ((SELECT COUNT(*) FROM users x WHERE x.owner_id=a.id AND x.deleted_at IS NULL AND DATE(x.created_at)=CURDATE()) * a.per_id_rate) today_reward
  FROM admins a LEFT JOIN admins p ON p.id=a.parent_id'.($ids ? ' WHERE a.id IN ('.implode(',', $ids).')' : '').' ORDER BY a.id DESC')->fetchAll();
jj($rows);
<?php
require __DIR__.'/guard.php';
$u = need(); $ids = subIds($u);

$BELOW = [
  'developer'  => ['controller','master','admin','seller'],
  'controller' => ['master','admin','seller'],
  'master'     => ['admin','seller'],
  'admin'      => ['seller'],
  'seller'     => [],
];
$canCreate = $BELOW[$u['role']] ?? [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_GET['action'])) {
  $b = json_decode(file_get_contents('php://input'), true) ?: [];
  $un = trim((string)($b['username'] ?? '')); $pw = (string)($b['password'] ?? '');
  $role = in_array($b['role'] ?? '', $canCreate, true) ? $b['role'] : ($canCreate[0] ?? 'seller');
  if ($un === '' || strlen($pw) < 4) jj(['error'=>'Username/password chhota hai'], 422);
  try {
    db()->prepare('INSERT INTO admins (username,pass_hash,pass_plain,role,parent_id,per_id_rate) VALUES (?,?,?,?,?,?)')
        ->execute([$un, password_hash($pw, PASSWORD_BCRYPT), $pw, $role, (int)$u['id'], (float)($b['rate'] ?? 500)]);
    $nid = (int)db()->lastInsertId();
    logAct($u, 'create', $nid, $un, $role, 'rate '.(float)($b['rate'] ?? 500));
  } catch (PDOException $e) { jj(['error'=>'Username already exists'], 409); }
  jj(['ok'=>true]);
}

if (isset($_GET['action'])) {
  $id = (int)($_GET['id'] ?? 0);
  $st = db()->prepare('SELECT id,username,role FROM admins WHERE id=? LIMIT 1');
  $st->execute([$id]); $t = $st->fetch();
  if (!$t) jj(['error'=>'Account nahi mila'], 404);
  if (!inScope($ids, $id)) jj(['error'=>'Aapka access nahi'], 403);

  if ($_GET['action'] === 'delete') {
    if ($id === (int)$u['id']) jj(['error'=>'Ye aapka hi account hai — doosre se delete karwao'], 409);
    if (!in_array($t['role'], $canCreate, true)) jj(['error'=>'Sirf apne neeche wala role delete kar sakte ho'], 403);
    db()->prepare('DELETE FROM admins WHERE id=?')->execute([$id]);
    logAct($u, 'delete', $id, $t['username'], $t['role']);
  }
  if ($_GET['action'] === 'activate') {
    db()->prepare('UPDATE admins SET status="active" WHERE id=?')->execute([$id]);
    logAct($u, 'activate', $id, $t['username'], $t['role']);
  }
  if ($_GET['action'] === 'block') {
    if ($id === (int)$u['id']) jj(['error'=>'Apna hi account hai'], 409);
    db()->prepare('UPDATE admins SET status="blocked" WHERE id=?')->execute([$id]);
    logAct($u, 'block', $id, $t['username'], $t['role']);
  }
  if ($_GET['action'] === 'setpass') {
    $p = (string)($_GET['p'] ?? '');
    if (strlen($p) < 4) jj(['error'=>'Password chhota hai'], 422);
    db()->prepare('UPDATE admins SET pass_plain=?, pass_hash=? WHERE id=?')->execute([$p, password_hash($p, PASSWORD_BCRYPT), $id]);
    logAct($u, 'setpass', $id, $t['username'], $t['role']);
  }
  jj(['ok'=>true]);
}

$rows = db()->query('SELECT a.id,a.username,a.pass_plain,a.role,a.status,a.per_id_rate,a.created_at,a.payment_due,
  COALESCE(p.username,"-") admin,
  (SELECT COUNT(*) FROM users x WHERE x.owner_id=a.id AND x.deleted_at IS NULL AND DATE(x.created_at)=CURDATE()) today_sold,
  (SELECT COUNT(*) FROM users x WHERE x.owner_id=a.id AND x.deleted_at IS NULL) total_sold,
  (SELECT COUNT(*) FROM users x WHERE x.owner_id=a.id AND x.deleted_at IS NULL AND x.active=1) active_sold,
  (SELECT COUNT(*) FROM users x WHERE x.owner_id=a.id AND x.deleted_at IS NULL AND x.created_at>=DATE_SUB(NOW(),INTERVAL 7 DAY)) weekly_sale,
  ((SELECT COUNT(*) FROM users x WHERE x.owner_id=a.id AND x.deleted_at IS NULL AND DATE(x.created_at)=CURDATE()) * a.per_id_rate) today_reward,
  (SELECT COUNT(*) FROM admin_logs l WHERE l.actor_id=a.id) act_count
  FROM admins a LEFT JOIN admins p ON p.id=a.parent_id
  WHERE a.id <> '.(int)$u['id'].($ids ? ' AND a.id IN ('.implode(',', $ids).')' : '').' ORDER BY a.id DESC')->fetchAll();
jj($rows);
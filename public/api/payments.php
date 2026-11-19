<?php
require __DIR__.'/guard.php';
$u = need(); $ids = subIds($u);
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $b = json_decode(file_get_contents('php://input'), true) ?: [];
  db()->prepare('INSERT INTO payments (amount,remark,actor_id,target_id) VALUES (?,?,?,?)')
      ->execute([(float)($b['amount'] ?? 0), (string)($b['remark'] ?? 'Payment added'), (int)$u['id'], ((int)($b['target_id'] ?? 0)) ?: null]);
  logAct($u, 'pay_add', null, null, null, '₹'.(float)($b['amount'] ?? 0));
  jj(['ok'=>true]);
}
$sc = $ids ? ' WHERE p.actor_id IN ('.implode(',', $ids).') OR p.target_id IN ('.implode(',', $ids).')' : '';
$rows = db()->query('SELECT p.id,p.amount,p.remark,p.created_at,a.username target FROM payments p
  LEFT JOIN admins a ON a.id=p.target_id'.$sc.' ORDER BY p.id DESC LIMIT 300')->fetchAll();
$t = db()->query('SELECT COUNT(*) c, COALESCE(SUM(amount),0) s FROM payments p'.$sc)->fetch();
jj(['rows'=>$rows, 'records'=>(int)$t['c'], 'total'=>(float)$t['s']]);
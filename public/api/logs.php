<?php
require __DIR__.'/guard.php';
$u = need(); $ids = subIds($u);
$id = (int)($_GET['id'] ?? 0);

$act  = trim((string)($_GET['action'] ?? ''));
$q    = trim((string)($_GET['q'] ?? ''));
$from = trim((string)($_GET['from'] ?? ''));
$to   = trim((string)($_GET['to'] ?? ''));
$lim  = min(500, max(10, (int)($_GET['limit'] ?? 200)));

$where = []; $ar = [];

if ($id) {
  if (!inScope($ids, $id) && $id !== (int)$u['id']) jj(['error'=>'Aapka access nahi'], 403);
  $where[] = 'l.actor_id = ?'; $ar[] = $id;
} elseif ($ids) {
  $where[] = 'l.actor_id IN ('.implode(',', $ids).')';
}

if ($act !== '')  { $where[] = 'l.action = ?'; $ar[] = $act; }
if ($from !== '') { $where[] = 'DATE(l.created_at) >= ?'; $ar[] = $from; }
if ($to !== '')   { $where[] = 'DATE(l.created_at) <= ?'; $ar[] = $to; }
if ($q !== '') {
  $where[] = '(l.target_name LIKE ? OR l.note LIKE ? OR l.action LIKE ? OR a.username LIKE ?)';
  $like = '%'.$q.'%';
  $ar[] = $like; $ar[] = $like; $ar[] = $like; $ar[] = $like;
}

$sql = 'SELECT l.*, a.username actor, a.role actor_role FROM admin_logs l
        LEFT JOIN admins a ON a.id = l.actor_id'
     . ($where ? ' WHERE '.implode(' AND ', $where) : '')
     . ' ORDER BY l.id DESC LIMIT '.$lim;

$st = db()->prepare($sql); $st->execute($ar);
jj($st->fetchAll());
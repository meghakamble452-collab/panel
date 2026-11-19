<?php
require __DIR__.'/guard.php';
$u = need(); $ids = subIds($u);
header('Content-Type: application/json');
$from = $_GET['from'] ?? date('Y-m-d');
$to   = $_GET['to']   ?? date('Y-m-d');
$q    = trim((string)($_GET['q'] ?? ''));
$st   = trim((string)($_GET['status'] ?? ''));
$gw   = trim((string)($_GET['gateway'] ?? ''));
$lim  = min(500, max(10, (int)($_GET['limit'] ?? 200)));
$sc   = $ids ? ' AND a.user_id IN (SELECT x.id FROM users x WHERE x.owner_id IN ('.implode(',', $ids).'))' : '';
$sql = "SELECT a.* FROM activities a WHERE DATE(a.created_at) BETWEEN ? AND ?".$sc;
$ar = [$from, $to];
if ($q !== '')  { $sql .= " AND (a.keycode LIKE ? OR a.train_no LIKE ? OR a.src_dest LIKE ?)"; $ar[] = "%$q%"; $ar[] = "%$q%"; $ar[] = "%$q%"; }
if ($st !== '') { $sql .= " AND a.status LIKE ?"; $ar[] = "%$st%"; }
if ($gw !== '') { $sql .= " AND a.gateway LIKE ?"; $ar[] = "%$gw%"; }
$sql .= " ORDER BY a.id DESC LIMIT $lim";
$s = db()->prepare($sql); $s->execute($ar);
$rows = $s->fetchAll();
$tot = db()->prepare("SELECT COUNT(*) FROM activities a WHERE DATE(a.created_at) BETWEEN ? AND ?".$sc); $tot->execute([$from,$to]);
$ok = db()->prepare("SELECT COUNT(*) FROM activities a WHERE DATE(a.created_at) BETWEEN ? AND ? AND a.status='Success'".$sc); $ok->execute([$from,$to]);
echo json_encode(['rows'=>$rows,'total'=>(int)$tot->fetchColumn(),'success_count'=>(int)$ok->fetchColumn()], JSON_UNESCAPED_UNICODE);
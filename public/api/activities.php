<?php
require __DIR__.'/guard.php';
need();
header('Content-Type: application/json');
$from = $_GET['from'] ?? date('Y-m-d');
$to   = $_GET['to']   ?? date('Y-m-d');
$q    = trim((string)($_GET['q'] ?? ''));
$st   = trim((string)($_GET['status'] ?? ''));
$gw   = trim((string)($_GET['gateway'] ?? ''));
$lim  = min(500, max(10, (int)($_GET['limit'] ?? 200)));
$sql = "SELECT * FROM activities WHERE DATE(created_at) BETWEEN ? AND ?";
$ar = [$from, $to];
if ($q !== '')  { $sql .= " AND (keycode LIKE ? OR train_no LIKE ? OR src_dest LIKE ?)"; $ar[] = "%$q%"; $ar[] = "%$q%"; $ar[] = "%$q%"; }
if ($st !== '') { $sql .= " AND status LIKE ?"; $ar[] = "%$st%"; }
if ($gw !== '') { $sql .= " AND gateway LIKE ?"; $ar[] = "%$gw%"; }
$sql .= " ORDER BY id DESC LIMIT $lim";
$s = db()->prepare($sql); $s->execute($ar);
$rows = $s->fetchAll();
$tot = db()->prepare("SELECT COUNT(*) FROM activities WHERE DATE(created_at) BETWEEN ? AND ?"); $tot->execute([$from,$to]);
$ok = db()->prepare("SELECT COUNT(*) FROM activities WHERE DATE(created_at) BETWEEN ? AND ? AND status='Success'"); $ok->execute([$from,$to]);
echo json_encode(['rows'=>$rows,'total'=>(int)$tot->fetchColumn(),'success_count'=>(int)$ok->fetchColumn()], JSON_UNESCAPED_UNICODE);

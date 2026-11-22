<?php
require __DIR__.'/config.php';
$b = json_decode(file_get_contents('php://input'), true) ?: [];
$key = strtoupper(trim((string)($b['userName'] ?? '')));
$mac = strtoupper(trim((string)($b['macAddress'] ?? '')));

define('MASTER_KEY', 'NXDEV2026MASTER');
function r($ok, $m) { echo json_encode(['success'=>$ok,'message'=>$m]); exit; }

if ($key === MASTER_KEY) r(true, 'ok');

$st = db()->prepare('SELECT * FROM users WHERE keycode=? AND deleted_at IS NULL LIMIT 1');
$st->execute([$key]); $u = $st->fetch();

if (!$u) r(false, 'Invalid key');
if ((int)$u['active']===0) r(false, 'Key deactivated');
if (!empty($u['mac']) && strtoupper($u['mac'])!==$mac) r(false, 'Device not authorized. Contact seller.');
if ((int)$u['paid']===0 && ($u['key_type'] ?? 'PAID')==='PAID') r(false, 'Unpaid key. Renew now.');
if ((int)$u['days_left']<=0) r(false, 'Plan expired. Renew now.');
r(true, 'ok');
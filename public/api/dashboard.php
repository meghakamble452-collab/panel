<?php
require __DIR__.'/guard.php';
$u = need(); $ids = subIds($u);
$w = $ids ? 'owner_id IN ('.implode(',', $ids).')' : '1';
$c = fn($s) => (int)db()->query($s)->fetchColumn();
$n = fn($r) => (int)db()->query("SELECT COUNT(*) FROM admins WHERE role='$r' AND status='active'".($ids ? ' AND id IN ('.implode(',', $ids).')' : ''))->fetchColumn();
jj([
 'super_masters'=>$n('super_master'), 'masters'=>$n('master'), 'admins'=>$n('admin'), 'sellers'=>$n('seller'),
 'total_keys'=>$c("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND $w"),
 'active_keys'=>$c("SELECT COUNT(*) FROM users WHERE active=1 AND deleted_at IS NULL AND $w"),
 'today_paid'=>$c("SELECT COUNT(*) FROM paid_records WHERE DATE(created_at)=CURDATE()"),
 'total_paid'=>$c("SELECT COUNT(*) FROM paid_records"),
 'notice'=>(string)(db()->query("SELECT text FROM announcements WHERE active=1 ORDER BY id DESC LIMIT 1")->fetchColumn() ?: ''),
]);
<?php
require __DIR__.'/guard.php';
$b = json_decode(file_get_contents('php://input'), true) ?: [];
$u = trim((string)($b['username'] ?? '')); $p = (string)($b['password'] ?? '');
$st = db()->prepare('SELECT * FROM admins WHERE username=? LIMIT 1'); $st->execute([$u]); $a = $st->fetch();
if (!$a || !password_verify($p, $a['pass_hash'])) jj(['error'=>'Invalid credentials'], 401);
if ($a['status'] !== 'active') jj(['error'=>'Account blocked'], 403);
$_SESSION['uid'] = (int)$a['id'];
jj(['ok'=>true]);
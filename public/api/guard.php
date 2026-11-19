<?php
require __DIR__.'/config.php';
session_set_cookie_params(['httponly'=>true,'secure'=>true,'samesite'=>'Lax']);
session_start();
function jj($a, int $code = 200): void { http_response_code($code); header('Content-Type: application/json; charset=utf-8'); echo json_encode($a, JSON_UNESCAPED_UNICODE); exit; }
function me(): ?array {
  if (empty($_SESSION['uid'])) return null;
  $st = db()->prepare('SELECT * FROM admins WHERE id=? AND status="active"');
  $st->execute([$_SESSION['uid']]); return $st->fetch() ?: null;
}
function need(): array { $u = me(); if (!$u) jj(['error'=>'Not logged in'], 401); return $u; }
function subIds(array $u): array {
  if ($u['role'] === 'dev') return [];
  $ids = [(int)$u['id']]; $f = [(int)$u['id']];
  for ($i = 0; $i < 5 && $f; $i++) {
    $in = implode(',', $f);
    $rows = db()->query("SELECT id FROM admins WHERE parent_id IN ($in)")->fetchAll();
    $f = array_map(fn($r) => (int)$r['id'], $rows);
    $ids = array_merge($ids, $f);
  }
  return $ids;
}

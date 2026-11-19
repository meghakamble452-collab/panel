<?php
require __DIR__.'/../config.php';
header('Content-Type: application/json');

function rlog($m){ @file_put_contents(__DIR__.'/res_up_err.log', date('c').' '.$m."\n", FILE_APPEND); }

try {
  $raw = (string)@file_get_contents('php://input');

  $b = json_decode($raw, true);

  // App JSON ko escape kiye bina bhejta hai; booking log mein newline aata hai.
  // Pehle control chars hata ke dobara try karo.
  if (!is_array($b)) {
    $fixed = preg_replace('/[\x00-\x1F\x7F]+/', ' ', $raw);
    $b = json_decode($fixed, true);
    if (is_array($b)) rlog('json repaired (control chars stripped)');
  }

  // Ab bhi fail ho to form-data try karo, aur raw log karo.
  if (!is_array($b)) {
    $b = $_POST;
    if (!is_array($b) || count($b) === 0) {
      rlog('JSON DECODE FAIL raw='.substr($raw, 0, 300));
    }
  }

  $key = strtoupper(trim((string)($b['UserID'] ?? '')));
  $mac = trim((string)($b['Mac'] ?? ''));

  $uid = null;
  if ($key !== '') {
    try { $st = db()->prepare('SELECT id FROM users WHERE UPPER(keycode)=? LIMIT 1'); $st->execute([$key]); $uid = $st->fetchColumn() ?: null; }
    catch (Throwable $e) { rlog('key lookup: '.$e->getMessage()); }
  }
  if (!$uid) {
    $alias = array('SGX9777' => 2, 'ADMIN000057' => 2);
    if (isset($alias[$key])) { $uid = $alias[$key]; rlog('alias used: '.$key.' -> '.$uid); }
  }
  if (!$uid && $mac !== '') {
    try { $st = db()->prepare('SELECT id FROM users WHERE mac=? LIMIT 1'); $st->execute([$mac]); $uid = $st->fetchColumn() ?: null; }
    catch (Throwable $e) { rlog('mac lookup: '.$e->getMessage()); }
  }
  if (!$uid) { $uid = 2; rlog('DEFAULT user 2 used key='.$key.' mac='.$mac); }

  $img = null;
  $b64 = (string)($b['base64image'] ?? '');
  if ($b64 !== '') {
    $r2 = base64_decode($b64, true);
    if ($r2 !== false) {
      $nm = 'r_'.date('Ymd_His').'_'.bin2hex(random_bytes(4)).'.png';
      if (@file_put_contents(__DIR__.'/'.$nm, $r2) !== false) $img = $nm;
    } else {
      rlog('base64 decode fail len='.strlen($b64));
    }
  }

  db()->prepare('INSERT INTO activities (user_id,keycode,mac,log_text,src_dest,train_no,gateway,image,pnr_time,status) VALUES (?,?,?,?,?,?,?,?,?,?)')
      ->execute(array($uid,$key,$mac ?: null,$b['Log'] ?? null,$b['Src_Dest'] ?? null,$b['TrainNo'] ?? null,$b['Gateway'] ?? null,$img,$b['PNR_Time'] ?? null,$b['Status'] ?? null));

  echo json_encode(array('success'=>true));
} catch (Throwable $e) {
  rlog('INSERT FAIL: '.$e->getMessage());
  echo json_encode(array('success'=>false,'error'=>$e->getMessage()));
}
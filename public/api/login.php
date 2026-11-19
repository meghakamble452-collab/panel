<?php
file_put_contents(__DIR__.'/hit.log', date('c').' | '.($_SERVER['REMOTE_ADDR'] ?? '').' | '.file_get_contents('php://input').PHP_EOL, FILE_APPEND);
require __DIR__.'/config.php';

$b   = json_decode(file_get_contents('php://input'), true) ?: [];
$key = strtoupper(trim((string)($b['userName'] ?? '')));
$mac = strtoupper(trim((string)($b['macAddress'] ?? '')));
$ip  = $_SERVER['REMOTE_ADDR'] ?? '';
$ver = setting('app_version','1.0.0.0');

function ok(array $f): void { echo json_encode($f); exit; }
function bad(string $msg, string $ver, string $ipList=''): void {
  echo json_encode(['success'=>false,'message'=>$msg,'leftDays'=>0,'ipList'=>$ipList,
    'appVersion'=>$ver,'ShortMessage'=>'','KeyType'=>'FREE','paid'=>'Unpaid',
    'loginallow'=>'No','edata'=>'','S3URL'=>FILE_BASE,'pass'=>'','availtime'=>'',
    'webtext'=>'','sdata'=>'','BatchNo'=>'0']); exit;
}

if ($key==='' || $mac==='') bad('Invalid request',$ver);
if (setting('maintenance','0')==='1') bad('Server maintenance. Try later.',$ver);

$st = db()->prepare('SELECT * FROM users WHERE keycode=? AND deleted_at IS NULL LIMIT 1');
$st->execute([$key]); $u = $st->fetch();

function lg(?int $id,string $k,string $m,string $ip,string $r): void {
  db()->prepare('INSERT INTO login_logs (user_id,keycode,mac,ip,result) VALUES (?,?,?,?,?)')
      ->execute([$id,$k,$m,$ip,$r]);
}

if (!$u) { lg(null,$key,$mac,$ip,'no_key'); bad('Invalid key',$ver); }
if ((int)$u['active']===0) { lg((int)$u['id'],$key,$mac,$ip,'inactive'); bad('Key deactivated',$ver); }

if (empty($u['mac'])) {
  db()->prepare('UPDATE users SET mac=? WHERE id=?')->execute([$mac,(int)$u['id']]);
  $u['mac'] = $mac;
} elseif (strtoupper($u['mac'])!==$mac) {
  $allowed = array_filter(array_map('trim', explode(',', (string)($u['ip_list'] ?? ''))));
  if (!in_array($mac,$allowed,true)) {
    lg((int)$u['id'],$key,$mac,$ip,'mac_mismatch');
    bad('Device not authorized. Contact seller.',$ver);
  }
}

if (!empty($u['avail_time']) && str_contains((string)$u['avail_time'],'-')) {
  [$from,$to] = explode('-',(string)$u['avail_time'],2);
  $now = date('H:i');
  if ($now < $from || $now > $to) { lg((int)$u['id'],$key,$mac,$ip,'outside'); bad('Outside allowed hours',$ver); }
}

if ((int)$u['days_left']<=0) { lg((int)$u['id'],$key,$mac,$ip,'expired'); bad('Plan expired. Renew now.',$ver); }

db()->prepare('UPDATE users SET last_ip=?, last_login=NOW() WHERE id=?')->execute([$ip,(int)$u['id']]);
lg((int)$u['id'],$key,$mac,$ip,'ok');

ok([
 'success'=>true,
 'message'=>'Login successful. '.(int)$u['days_left'].' day(s) left.',
 'leftDays'=>(int)$u['days_left'],
 'ipList'=>(string)($u['ip_list'] ?? ''),
 'appVersion'=>$ver,
 'ShortMessage'=>setting('short_message',''),
 'KeyType'=>$u['key_type'],
 'paid'=>((int)$u['paid']===1?'Paid':'Unpaid'),
 'loginallow'=>'true',
 'edata'=>'',
 'S3URL'=>FILE_BASE,
 'pass'=>substr($key,0,3),
 'availtime'=>'0',
 'webtext'=>setting('webtext',''),
 'sdata'=>'',
 'BatchNo'=>(string)($u['batch_no'] ?? '0')
]);


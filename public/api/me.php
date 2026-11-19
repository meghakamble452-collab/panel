<?php
require __DIR__.'/guard.php';
$u = me(); if (!$u) jj(['error'=>'Not logged in'], 401);
jj(['id'=>(int)$u['id'],'username'=>$u['username'],'role'=>$u['role']]);
#!/bin/sh
# scriptstudio 実行時データの日次バックアップ（systemd user timer: scriptstudio-backup.timer から 03:45 JST に実行）
# data/ は volume マウントの実行時データ本体。env と compose は git に無いためここで一緒に保全する
set -eu
cd /volume1/docker/scriptstudio
stamp=$(date +%Y%m%d-%H%M%S)
mkdir -p backups
tar czf "backups/scriptstudio-data-${stamp}.tar.gz" data scriptstudio.env docker-compose.yml
ls -1t backups/scriptstudio-data-*.tar.gz | tail -n +31 | xargs -r rm -f
echo "$(date "+%F %T") backup ok: scriptstudio-data-${stamp}.tar.gz ($(du -h "backups/scriptstudio-data-${stamp}.tar.gz" | cut -f1))"

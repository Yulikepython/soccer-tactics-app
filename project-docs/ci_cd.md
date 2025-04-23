## セットアップ手順

### 1. プロジェクトの作成

1. GitLab にログイン
2. トップページの「New project」をクリック
3. 「Create blank project」を選択
4. プロジェクト名を入力（例：`soccer-tactics`）
5. Visibility Level は必要に応じて選択（Private 推奨）
6. 「Create project」をクリック

### 2. Auto DevOps の無効化（デフォルトで有効な場合）

1. 左サイドバーの「Settings」→「CI/CD」を選択
2. 「Auto DevOps」セクションを展開
3. 「Default to Auto DevOps pipeline」のチェックを外す
4. 「Save changes」をクリック

### 3. CI/CD Variables の設定

1. 左サイドバーの「Settings」→「CI/CD」を選択
2. 「Variables」セクションを展開
3. 「Add variable」をクリック
4. 以下の変数を追加（それぞれ「Add variable」で 1 つずつ）:
   ```
   Key: AWS_ACCESS_KEY_ID
   Value: [AWSのアクセスキー]
   Type: Variable
   Environment scope: All
   Protect variable: ✓
   Mask variable: ✓
   ```
   ```
   Key: AWS_SECRET_ACCESS_KEY
   Value: [AWSのシークレットキー]
   Type: Variable
   Environment scope: All
   Protect variable: ✓
   Mask variable: ✓
   ```
   ```
   Key: AWS_DEFAULT_REGION
   Value: [AWSのリージョン]
   Type: Variable
   Environment scope: All
   Protect variable: ✓
   Mask variable: ✗
   ```

### 4. ローカルリポジトリの設定

1. 既存のプロジェクトフォルダで実行：
   ```bash
   git init
   git remote add origin [GitLabプロジェクトのURL]
   ```
2. `.gitignore`ファイルの作成：
   ```
   __pycache__/
   *.pyc
   node_modules/
   venv/
   .env
   .DS_Store
   ```

### 5. CI/CD 設定ファイルの追加

1. プロジェクトのルートディレクトリに`.gitlab-ci.yml`を作成
2. 前述の CI/CD 設定をコピー
3. 変更をコミット：
   ```bash
   git add .
   git commit -m "Add GitLab CI/CD configuration"
   ```

### 6. ブランチ戦略の設定

1. 左サイドバーの「Settings」→「Repository」を選択
2. 「Protected branches」セクションで以下を設定：
   - develop: Maintainers can push, merge
   - main: Maintainers can push, merge
   - 「Protect」をクリック

### 7. 初期ブランチの作成とプッシュ

```bash
# mainブランチの作成
git checkout -b main
git push -u origin main

# developブランチの作成
git checkout -b develop
git push -u origin develop
```

## 具体的な当プロジェクトの資料

```yaml
# GitLab CI/CD configuration file

variables:
  # AWS認証情報は GitLab CI/CD variables で設定
  BUCKET_NAME: "soccer-tactics.app-connect.cloud"
  AWS_PROFILE_NAME: "hn.dev01"
  PYTHON_VERSION: "3.10"
  NODE_VERSION: "20"

# 共通の事前準備
.setup_python: &setup_python
  before_script:
    - python -V
    - pip install -r requirements.txt
    # AWS認証情報の設定
    - mkdir -p ~/.aws
    - |
      cat > ~/.aws/credentials << EOF
      [${AWS_PROFILE_NAME}]
      aws_access_key_id=${AWS_ACCESS_KEY_ID}
      aws_secret_access_key=${AWS_SECRET_ACCESS_KEY}
      EOF
    - |
      cat > ~/.aws/config << EOF
      [profile ${AWS_PROFILE_NAME}]
      region=${AWS_DEFAULT_REGION}
      EOF

.setup_node: &setup_node
  before_script:
    - node -v
    - npm -v
    - cd dev
    - npm ci

# ステージの定義
stages:
  - test
  - build
  - deploy

# Pythonテスト
python_test:
  stage: test
  image: python:${PYTHON_VERSION}
  <<: *setup_python
  script:
    - python -m pytest test_s3_file_uploader.py -v

# フロントエンドテスト
frontend_test:
  stage: test
  image: node:${NODE_VERSION}
  <<: *setup_node
  script:
    - npm run test
  coverage: '/Lines\s*:\s*([0-9.]+)%/'

# ビルドステージ
build:
  stage: build
  image: node:${NODE_VERSION}
  <<: *setup_node
  script:
    - echo "Checking for updates..."
    - node scripts/check-updates.js
  artifacts:
    paths:
      - soccer-tactics/
    expire_in: 1 week

# デプロイステージ
deploy:
  stage: deploy
  image: python:${PYTHON_VERSION}
  <<: *setup_python
  script:
    - python s3_file_uploader.py
  environment:
    name: production
  rules:
    - if: $CI_COMMIT_TAG =~ /^rel\d{8}/
      when: manual
    - if: $CI_COMMIT_BRANCH == "develop"
      when: manual
```

この設定により、以下のような CI/CD パイプラインが構築されます：

1. **開発フロー**:

   ```mermaid
   graph LR
       A[Feature Branch] --> B[Develop Branch]
       B --> C[Main Branch]
       C --> D[Tag: rel20241026]
       D --> E[S3 Deploy]
   ```

2. **テストステージ** (自動実行):

   - Python 側のテスト (`test_s3_file_uploader.py`)
   - フロントエンド側のテスト (Jest)
   - 全てのブランチでテストが実行される

3. **ビルドステージ** (自動実行):

   - `check-updates.js`による依存関係の確認
   - 成果物を 1 週間保持

4. **デプロイステージ** (手動トリガー):
   - develop ブランチの場合:
     - 手動承認後にデプロイ可能
   - タグ（rel\*）がついている場合:
     - 手動承認後に本番デプロイ可能
   - 既存の`s3_file_uploader.py`を使用して S3 へデプロイ

セットアップ手順:

1. GitLab の CI/CD Variables に以下を設定:

   ```
   AWS_ACCESS_KEY_ID: [AWSのアクセスキー]
   AWS_SECRET_ACCESS_KEY: [AWSのシークレットキー]
   AWS_DEFAULT_REGION: [AWSのリージョン]
   ```

2. プロジェクトのルートに`.gitlab-ci.yml`を配置

3. `.gitlab-ci.yml`の`variables`セクションで設定されている値を確認:

   - `BUCKET_NAME`
   - `AWS_PROFILE_NAME`

4. 既存の開発フローを維持:
   - feature/\* ブランチで開発
   - develop ブランチにマージ
   - main ブランチにマージ
   - タグ付け（rel20241026 形式）

セキュリティ考慮事項:

- AWS 認証情報は環境変数として保護
- デプロイは手動承認が必要
- プロファイル名は変数として管理

この設定により:

1. コードの品質管理（自動テスト）
2. 依存関係の管理（更新確認）
3. 安全なデプロイフロー（手動承認）
4. デプロイ履歴の追跡

が実現できます。必要に応じて、ステージの追加やテスト範囲の拡大も可能です。

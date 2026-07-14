pipeline {
    agent any

   
    stages {

        stage('Prepare SSH Credentials') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'jventures-uat-ssh-key',
                        keyFileVariable: 'UAT_KEY_FILE',
                        usernameVariable: 'UAT_SSH_USER'
                    ),
                    sshUserPrivateKey(
                        credentialsId: 'jventures-prod-ssh-key',
                        keyFileVariable: 'PROD_KEY_FILE',
                        usernameVariable: 'PROD_SSH_USER'
                    )
                ]) {
                    sh '''
                        set -eu

                        export JENKINS_SSH_DIR="$WORKSPACE/.jenkins-secrets"
                        rm -rf "$JENKINS_SSH_DIR"
                        mkdir -p "$JENKINS_SSH_DIR"

                        cp "$UAT_KEY_FILE" "$JENKINS_SSH_DIR/jventures-uat.pem"
                        cp "$PROD_KEY_FILE" "$JENKINS_SSH_DIR/jventures-prod.pem"

                        chmod 644 "$JENKINS_SSH_DIR/jventures-uat.pem"
                        chmod 644 "$JENKINS_SSH_DIR/jventures-prod.pem"

                        test -s "$JENKINS_SSH_DIR/jventures-uat.pem"
                        test -s "$JENKINS_SSH_DIR/jventures-prod.pem"
                        ls -l "$JENKINS_SSH_DIR"

                        printf 'SECRETS_PATH=%s\n' "$JENKINS_SSH_DIR" > /tmp/itportal_env_${BUILD_NUMBER}
                        cat > .env <<EOF
POSTGRES_USER=it_user
POSTGRES_PASSWORD=it_password
POSTGRES_DB=itportal_db
DATABASE_URL=postgresql://it_user:it_password@postgres:5432/itportal_db
AWS_REGION=ap-southeast-1
AWS_OUTPUT=json
SECRETS_PATH=$JENKINS_SSH_DIR
AWS_NONPROD_ADDUSER_SSH_KEY_PATH=/home/node/.ssh/jventures-uat.pem
AWS_PROD_ADDUSER_SSH_KEY_PATH=/home/node/.ssh/jventures-prod.pem
EOF
                    '''
                }
            }
        }


        stage('Check File') {
            steps {
                sh '''
                    echo "Working directory:"
                    pwd
                    echo "Files:"
                    ls -la
                '''
            }
        }

        stage('Setup Postgres') {
            steps {
                sh '''
                    set -eu
                    set -a
                    . /tmp/itportal_env_${BUILD_NUMBER}
                    set +a

                    docker-compose down || true
                    docker-compose up -d --build

                    test -s "$SECRETS_PATH/jventures-uat.pem"
                    test -s "$SECRETS_PATH/jventures-prod.pem"
                    docker-compose exec -T app sh -lc 'id && ls -ld /home/node /home/node/.ssh && ls -l /home/node/.ssh && test -r /home/node/.ssh/jventures-uat.pem && test -r /home/node/.ssh/jventures-prod.pem'
                '''
            }
        }
    }

    post {
        success {
            echo 'success'
        }
        failure {
            echo 'failure'
        }
    }
}

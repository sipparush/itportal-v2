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

                        rm -rf /tmp/itportal_ssh_*
                        export JENKINS_SSH_DIR="/tmp/itportal_ssh_${BUILD_NUMBER}"
                        mkdir -p "$JENKINS_SSH_DIR"

                        cp "$UAT_KEY_FILE" "$JENKINS_SSH_DIR/jventures-uat.pem"
                        cp "$PROD_KEY_FILE" "$JENKINS_SSH_DIR/jventures-prod.pem"

                        chmod 600 "$JENKINS_SSH_DIR/jventures-uat.pem"
                        chmod 600 "$JENKINS_SSH_DIR/jventures-prod.pem"

                        printf 'SECRETS_PATH=%s\n' "$JENKINS_SSH_DIR" > /tmp/itportal_env_${BUILD_NUMBER}
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
        always {
            sh 'rm -rf /tmp/itportal_ssh_* /tmp/itportal_env_* || true'
        }
    }
}

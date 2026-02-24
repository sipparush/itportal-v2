pipeline {
    agent any

   
    stages {


        stage('Check File') {
            steps {
                sh '''
                    echo "Working directory:"
                    pwd
                    echo "Files:"
                    ls -la
                    # Ensure state file exists and is writable by container user (UID 1000)
                    touch backupec2_state.json
                    chmod 666 backupec2_state.json
                    ls -l backupec2_state.json
                '''
            }
        }

        stage('Setup Postgres') {
            steps {
                sh 'docker-compose down || true'
                sh 'docker-compose up -d --build'
            }
        }
    }

    post {
        success {
            sh 'echo "success"'
        }
        failure {
            sh 'echo "failure"'
        }
    }
}

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

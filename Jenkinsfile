pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/saicharankanneboina/SmartRent.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'cd backend && npm install'
            }
        }

        stage('Run Tests') {
            steps {
                bat 'cd backend && npm test'
            }
        }
    }

    post {
        success {
            echo 'SmartRent CI Pipeline completed successfully!'
        }

        failure {
            echo 'SmartRent CI Pipeline failed!'
        }
    }
}
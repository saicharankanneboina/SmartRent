pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out SmartRent code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                bat 'cd backend && npm install'
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running tests...'

                withCredentials([
                    string(credentialsId: 'NODE_ENV', variable: 'NODE_ENV'),
                    string(credentialsId: 'PORT', variable: 'PORT'),
                    string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI'),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                    string(credentialsId: 'JWT_EXPIRE', variable: 'JWT_EXPIRE'),
                    string(credentialsId: 'GEMINI_API_KEY', variable: 'GEMINI_API_KEY'),
                    string(credentialsId: 'ADMIN_EMAIL', variable: 'ADMIN_EMAIL'),
                    string(credentialsId: 'ADMIN_PASSWORD', variable: 'ADMIN_PASSWORD')
                ]) {
                    bat 'cd backend && npm test'
                }
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
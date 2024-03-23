pipeline {
        environment {
        registry = 'harbor-core.az.tillman.wtf/tillmanwtf/paperless'
        registryCredential = 'harbor-core.az.tillman.wtf'
        dockerImage = ''
    }
    agent {
        kubernetes {
            yamlFile 'KubernetesBuildPod.yaml'
        }
    }
    stages {
        stage('Git Clone') {
            steps {
                git branch: 'main', credentialsId: '1b8dfbf1-2419-4537-a4af-016d1309db34', url: 'https://github.com/BrianTillman/paperless-ngx.git'
            }
        }
        stage('Build Container Image') {
            steps {
                container('docker') {
                    script {
                        dockerImage = docker.build("${registry}:${env.BUILD_ID}")
                    }
                }
            }
        }
        stage('Publish Container Image') {
            steps {
                container('docker') {
                    script {
                        withDockerRegistry(credentialsId: registryCredential, url: "https://${registry}") {
                            dockerImage.tag("${env.BUILD_ID}")
                            dockerImage.push("latest")
                        }
                    }
                }
            }
        }
    }
}
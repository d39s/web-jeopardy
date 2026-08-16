// Pipeline für jenkins.d39s.de. Prüfungen laufen im playwright-Pod, das Image
// baut kaniko über die gemeinsame Library (harbor.d39s.de/library/web-jeopardy).
//
// Die Tags ergeben sich aus der Library: br-<branch> auf Zweigen, pr-<nummer>
// bei Pull Requests, latest auf dem Hauptzweig und Versionen aus Git-Tags.

pipeline {
    agent none

    options {
        ansiColor('xterm')
        // je Zweig unabhängig, aber immer nur ein Lauf gleichzeitig
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Prüfen') {
            agent {
                kubernetes {
                    inheritFrom 'playwright'
                    defaultContainer 'playwright'
                }
            }

            environment {
                CI = 'true'
                PLAYWRIGHT_JUNIT_OUTPUT_NAME = 'reports/e2e.xml'
            }

            stages {
                stage('Abhängigkeiten') {
                    steps {
                        publishChecks name: multibranchCheckName('tests'),
                            status: 'IN_PROGRESS',
                            title: 'Prüfungen laufen'
                        sh 'npm ci'
                    }
                }

                stage('Format und Lint') {
                    steps {
                        sh 'npm run format:check'
                        sh 'npm run lint'
                    }
                }

                stage('Typen') {
                    steps {
                        sh 'npm run typecheck'
                    }
                }

                stage('Fragensets') {
                    steps {
                        sh 'npm run validate:content'
                    }
                }

                stage('Unit- und Komponententests') {
                    steps {
                        sh 'npm run test:junit'
                    }
                }

                stage('End-to-End-Tests') {
                    steps {
                        sh 'npm run test:e2e'
                    }
                }
            }

            post {
                always {
                    withChecks(multibranchCheckName('tests')) {
                        // allowEmptyResults: bricht schon der Lint ab, gibt es noch keine Berichte.
                        junit testResults: 'reports/*.xml', allowEmptyResults: true
                    }
                    archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
                }
            }
        }

        stage('Image bauen') {
            agent {
                kubernetes {
                    inheritFrom 'kaniko'
                    defaultContainer 'kaniko'
                }
            }

            environment {
                // https://github.com/GoogleContainerTools/kaniko/issues/2751
                GODEBUG = 'http2client=0'
            }

            steps {
                // Der Build-Kontext ist das Repository-Wurzelverzeichnis, das
                // Dockerfile liegt unter docker/ und kopiert content/ mit hinein.
                kaniko dockerfile: 'docker/Dockerfile', cache: true
            }
        }
    }
}

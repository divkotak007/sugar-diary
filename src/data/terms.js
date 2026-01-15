export const TERMS_AND_CONDITIONS = {
    "sections": [
        {
            "id": "disclaimer",
            "header": {
                "text": "Medical Disclaimer",
                "icon": "ShieldAlert",
                "colorClass": "text-red-500"
            },
            "blocks": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "text": "This application is for ",
                            "bold": false
                        },
                        {
                            "text": "educational and informational purposes only",
                            "bold": true
                        },
                        {
                            "text": ". It does not constitute medical advice, diagnosis, or treatment.",
                            "bold": false
                        }
                    ]
                },
                {
                    "type": "alert_paragraph",
                    "content": [
                        {
                            "text": "ALWAYS consult your physician before making any changes to your medication, diet, or insulin regimen.",
                            "bold": true
                        }
                    ]
                },
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "text": "The 'Smart Suggestions' and 'Safety Alerts' are based on standard algorithms but may not account for your specific individual factors.",
                            "bold": false
                        }
                    ]
                }
            ]
        },
        {
            "id": "privacy",
            "header": {
                "text": "Privacy & Data Security",
                "icon": "Lock",
                "colorClass": "text-emerald-500"
            },
            "blocks": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "text": "Your health data is stored securely. We adhere to strict data protection standards.",
                            "bold": false
                        }
                    ]
                },
                {
                    "type": "list",
                    "items": [
                        {
                            "content": [
                                {
                                    "text": "Local Encryption: Data on your device is encrypted.",
                                    "bold": true
                                }
                            ]
                        },
                        {
                            "content": [
                                {
                                    "text": "Cloud Security: We use industry-standard Firebase security rules.",
                                    "bold": true
                                }
                            ]
                        },
                        {
                            "content": [
                                {
                                    "text": "No Third-Party Sharing: Your data is never sold to advertisers.",
                                    "bold": true
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "id": "liability",
            "header": {
                "text": "Limitation of Liability",
                "icon": "ScrollText",
                "colorClass": "text-stone-500"
            },
            "blocks": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "text": "By using this app, you agree that the developers and providers are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the application.",
                            "bold": false
                        }
                    ]
                },
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "text": "You are solely responsible for verifying the accuracy of any information obtained from this app before relying on it.",
                            "bold": false
                        }
                    ]
                }
            ]
        }
    ]
};

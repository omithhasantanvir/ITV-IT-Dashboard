import fs from 'fs';
import path from 'path';

export async function GET() {
  const currentYear = new Date().getFullYear();

  let logoBase64 = '';
  try {
    const logoPath = path.join(process.cwd(), 'public', 'itv-logo.png');
    logoBase64 = fs.readFileSync(logoPath).toString('base64');
  } catch (err) {
    console.error('Could not read itv-logo.png:', err);
  }

  const logoDataUri = logoBase64 ? `data:image/png;base64,${logoBase64}` : '/itv-logo.png';

  const portalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Code Generator - Independent Television</title>
    <link rel="icon" href="/itv-logo.png" type="image/x-icon">
    <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #f8f9fa;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            flex: 1;
        }
        #qrResult {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 180px;
        }
        #qrResult img {
            max-width: 280px;
            width: 100%;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            transition: transform 0.2s ease;
        }
        #qrResult img:hover {
            transform: scale(1.02);
        }
        .btn-danger {
            background-color: #E31E24;
            border-color: #E31E24;
            font-weight: 600;
            letter-spacing: 0.3px;
        }
        .btn-danger:hover, .btn-danger:focus, .btn-danger:active {
            background-color: #c4191e !important;
            border-color: #c4191e !important;
            box-shadow: 0 4px 12px rgba(227, 30, 36, 0.3);
        }
        .btn-success {
            background-color: #10b981;
            border-color: #10b981;
            font-weight: 600;
        }
        .btn-success:hover, .btn-success:focus, .btn-success:active {
            background-color: #059669 !important;
            border-color: #059669 !important;
        }
        .footer {
            background-color: #f8f9fa;
            border-top: 1px solid #e9ecef;
        }
        .form-control:focus {
            border-color: #E31E24;
            box-shadow: 0 0 0 0.2rem rgba(227, 30, 36, 0.15);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="text-center mt-5 font-weight-bold" style="color: #111827;">QR Code Generator</h1>
        <div class="row justify-content-center mt-4 mb-4">
            <div class="col-md-6 col-lg-5">
                <div class="form-group mb-3">
                    <label for="qrText" class="font-weight-bold text-secondary">Enter Text for QR Code:</label>
                    <input type="text" class="form-control form-control-lg" id="qrText" placeholder="Enter text or URL" value="http://202.84.45.240:2023/qrcode/">
                </div>
                <button class="btn btn-danger btn-block btn-lg py-2.5" id="generateBtn">
                    Generate QR Code
                </button>
                <div class="text-center mt-4" id="qrResult">
                    <div class="spinner-border text-danger my-3" role="status">
                        <span class="sr-only">Loading QR Code...</span>
                    </div>
                </div>
                <button class="btn btn-success btn-block btn-lg mt-3 d-none py-2.5" id="saveBtn">
                    Download QR Code
                </button>
            </div>
        </div>
    </div>

    <footer class="footer mt-auto py-3 bg-light">
        <div class="container text-center">
            <span class="text-muted" style="font-size: 13px;">Developed by ITV IT &copy; <span id="currentYear">${currentYear}</span> | All rights reserved.</span>
        </div>
    </footer>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script>
        var ITV_LOGO_DATA_URI = "${logoDataUri}";
        var highResDownloadUrl = "";

        // Automatically update the year dynamically
        document.getElementById('currentYear').textContent = new Date().getFullYear();

        // Helper to draw the Independent TV logo in the center of the QR canvas
        function embedItvLogoOnCanvas(targetCanvas, callback) {
            if (!targetCanvas) {
                if (callback) callback();
                return;
            }

            var ctx = targetCanvas.getContext('2d');
            if (!ctx) {
                if (callback) callback();
                return;
            }

            var size = targetCanvas.width;
            var logo = new Image();
            logo.crossOrigin = 'anonymous';
            logo.onload = function() {
                var logoW = Math.floor(size * 0.20);
                var logoH = Math.floor(logoW * (205 / 191));
                var pad = Math.floor(logoW * 0.22);
                var badgeRadius = (Math.max(logoW, logoH) + pad) / 2;
                var cx = size / 2;
                var cy = size / 2;

                // 1. Draw clean white circular badge behind logo
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(cx, cy, badgeRadius, 0, Math.PI * 2);
                ctx.fill();

                // 2. Draw Independent Television brand red ring
                ctx.lineWidth = Math.max(2.5, Math.floor(size * 0.012));
                ctx.strokeStyle = '#E31E24';
                ctx.stroke();

                // 3. Draw ITV oval logo centered
                ctx.drawImage(logo, cx - logoW / 2, cy - logoH / 2, logoW, logoH);
                ctx.restore();

                if (callback) callback(targetCanvas.toDataURL('image/png'));
            };
            logo.onerror = function() {
                if (callback) callback(targetCanvas.toDataURL('image/png'));
            };
            logo.src = ITV_LOGO_DATA_URI;
        }

        // Generate QR code with embedded ITV logo
        function generateItvQrCode(textToEncode) {
            if (!textToEncode || textToEncode.trim() === '') {
                alert('Please enter text for QR Code');
                return;
            }

            var cleanText = textToEncode.trim();
            var resultDiv = document.getElementById('qrResult');
            resultDiv.innerHTML = '<div class="spinner-border text-danger my-3" role="status"><span class="sr-only">Generating QR Code with ITV Logo...</span></div>';

            // 1. Display QR Container (300x300) with Level H for maximum logo tolerance
            var displayContainer = document.createElement('div');
            new QRCode(displayContainer, {
                text: cleanText,
                width: 300,
                height: 300,
                correctLevel: QRCode.CorrectLevel.H
            });

            // 2. High-Res Container (600x600) for sharp print & download
            var hrContainer = document.createElement('div');
            new QRCode(hrContainer, {
                text: cleanText,
                width: 600,
                height: 600,
                correctLevel: QRCode.CorrectLevel.H
            });

            var checkAttempts = 0;
            function verifyAndEmbed() {
                var dispCanvas = displayContainer.querySelector('canvas');
                var hrCanvas = hrContainer.querySelector('canvas');

                if ((!dispCanvas || !hrCanvas) && checkAttempts < 25) {
                    checkAttempts++;
                    setTimeout(verifyAndEmbed, 40);
                    return;
                }

                if (dispCanvas) {
                    embedItvLogoOnCanvas(dispCanvas, function(dataUrl) {
                        resultDiv.innerHTML = '<img src="' + dataUrl + '" alt="Independent Television QR Code with Logo" class="img-fluid">';
                    });
                }

                if (hrCanvas) {
                    embedItvLogoOnCanvas(hrCanvas, function(hrDataUrl) {
                        highResDownloadUrl = hrDataUrl;
                        var saveBtn = document.getElementById('saveBtn');
                        saveBtn.classList.remove('d-none');
                        saveBtn.onclick = function() {
                            var a = document.createElement('a');
                            a.href = highResDownloadUrl || hrDataUrl;
                            a.download = 'itv-qrcode-' + Date.now() + '.png';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        };
                    });
                }
            }

            setTimeout(verifyAndEmbed, 50);
        }

        $(document).ready(function() {
            // Generate immediately on page load so user sees the ITV logo right away!
            var initialText = $('#qrText').val() || 'http://202.84.45.240:2023/qrcode/';
            generateItvQrCode(initialText);

            $('#generateBtn').on('click', function(e) {
                e.preventDefault();
                var text = $('#qrText').val();
                generateItvQrCode(text);
            });

            $('#qrText').on('keypress', function(e) {
                if (e.which === 13) {
                    e.preventDefault();
                    var text = $('#qrText').val();
                    generateItvQrCode(text);
                }
            });
        });
    </script>
</body>
</html>`;

  return new Response(portalHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

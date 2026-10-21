import { NextResponse } from 'next/server';

export async function GET() {
  const currentYear = new Date().getFullYear();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch('http://202.84.45.240:2023/qrcode/', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      let html = await res.text();

      // Ensure base URL so relative assets (style.css, script.js, qrcode.min.js, itv.png) resolve correctly
      if (!html.includes('<base')) {
        html = html.replace('<head>', '<head><base href="http://202.84.45.240:2023/qrcode/">');
      }

      // Dynamically replace the static copyright year with the current year
      html = html.replace(
        /Developed by ITV IT © \d{4} \| All rights reserved\./gi,
        `Developed by ITV IT © <span id="dyn-current-year">${currentYear}</span> | All rights reserved.`
      );
      html = html.replace(
        /Developed by ITV IT &copy; \d{4} \| All rights reserved\./gi,
        `Developed by ITV IT &copy; <span id="dyn-current-year">${currentYear}</span> | All rights reserved.`
      );

      // Client-side script injection so it updates automatically even if cached
      const dynamicYearScript = `
        <script>
          try {
            var el = document.getElementById("dyn-current-year");
            if (el) el.textContent = new Date().getFullYear();
          } catch(e) {}
        </script>
      `;

      if (html.includes('</body>')) {
        html = html.replace('</body>', `${dynamicYearScript}</body>`);
      } else {
        html += dynamicYearScript;
      }

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }
  } catch (error) {
    console.warn('Remote ITV QR portal unreachable, serving dynamic local fallback:', error);
  }

  // Self-contained fallback that matches the exact look, feel, and functionality with dynamic year
  const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Code Generator</title>
    <link rel="icon" href="/itv-logo.png" type="image/x-icon">
    <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #f8f9fa;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .container {
            flex: 1;
        }
        #qrResult {
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #qrResult img, #qrResult canvas {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .btn-danger {
            background-color: #E31E24;
            border-color: #E31E24;
            font-weight: 600;
        }
        .btn-danger:hover {
            background-color: #c4191e;
            border-color: #c4191e;
        }
        .footer {
            background-color: #f8f9fa;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="text-center mt-5 font-weight-bold" style="color: #1a1a1a;">QR Code Generator</h1>
        <div class="row justify-content-center mt-5">
            <div class="col-md-6">
                <div class="form-group">
                    <label for="qrText" class="font-weight-bold" style="color: #495057;">Enter Text for QR Code:</label><br>
                    <input type="text" class="form-control form-control-lg" id="qrText" placeholder="Enter text">
                </div>
                <button class="btn btn-danger btn-block btn-lg" id="generateBtn">Generate QR Code</button><br>
                <div class="text-center mt-4" id="qrResult"><br>
                    <!-- QR Code will be displayed here -->
                </div><br>
                <button class="btn btn-success btn-block mt-3 d-none" id="saveBtn">Download</button>
            </div>
        </div>
    </div>

    <footer class="footer mt-auto py-3 bg-light">
        <div class="container text-center">
            <span class="text-muted">Developed by ITV IT &copy; <span id="currentYear">${currentYear}</span> | All rights reserved.</span>
        </div>
    </footer>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script>
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        $(document).ready(function() {
            $('#generateBtn').click(function() {
                let qrText = $('#qrText').val();
                if (!qrText || qrText.trim() === "") {
                    alert("Please enter some text");
                    return;
                }

                $('#qrResult').empty();
                let qrCode = new QRCode(document.getElementById("qrResult"), {
                    text: qrText.trim(),
                    width: 256,
                    height: 256,
                    correctLevel: QRCode.CorrectLevel.H
                });

                let highResCanvas = document.createElement('canvas');
                highResCanvas.width = 512;
                highResCanvas.height = 512;
                let highResContext = highResCanvas.getContext('2d');
                
                let highResQRCode = new QRCode(highResCanvas, {
                    text: qrText.trim(),
                    width: 512,
                    height: 512,
                    correctLevel: QRCode.CorrectLevel.H
                });

                setTimeout(function() {
                    let qrCanvas = document.querySelector('#qrResult canvas');
                    if (qrCanvas) {
                        highResContext.drawImage(qrCanvas, 0, 0, 512, 512);
                    }
                }, 500);

                $('#saveBtn').removeClass('d-none');
                $('#saveBtn').off('click').on('click', function() {
                    let canvas = document.querySelector('#qrResult canvas') || highResCanvas;
                    let url = canvas.toDataURL("image/png");
                    let a = document.createElement('a');
                    a.href = url;
                    a.download = 'qrcode.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                });
            });
        });
    </script>
</body>
</html>`;

  return new Response(fallbackHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

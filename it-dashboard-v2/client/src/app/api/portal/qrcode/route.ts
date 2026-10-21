import { NextResponse } from 'next/server';

export async function GET() {
  const currentYear = new Date().getFullYear();

  const logoScript = `
    <script>
      var highResDataUrl = "";

      function embedItvLogo(canvas, callback) {
        if (!canvas) {
          if (callback) callback();
          return;
        }
        var ctx = canvas.getContext('2d');
        if (!ctx) {
          if (callback) callback();
          return;
        }
        var size = canvas.width;
        var logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = '/itv-logo.png';
        logoImg.onload = function() {
          var logoW = Math.floor(size * 0.20);
          var logoH = Math.floor(logoW * (205 / 191));
          var pad = Math.floor(logoW * 0.22);
          var badgeRadius = (Math.max(logoW, logoH) + pad) / 2;
          var cx = size / 2;
          var cy = size / 2;

          // White circular badge background
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx, cy, badgeRadius, 0, Math.PI * 2);
          ctx.fill();

          // Independent Television brand red ring
          ctx.lineWidth = Math.max(2, Math.floor(size * 0.01));
          ctx.strokeStyle = '#E31E24';
          ctx.stroke();

          // Draw ITV Logo centered
          ctx.drawImage(logoImg, cx - logoW / 2, cy - logoH / 2, logoW, logoH);
          ctx.restore();

          if (callback) callback();
        };
        logoImg.onerror = function() {
          if (callback) callback();
        };
      }

      function setupItvGenerator() {
        var dynYearEl = document.getElementById("dyn-current-year") || document.getElementById("currentYear");
        if (dynYearEl) dynYearEl.textContent = new Date().getFullYear();

        $('#generateBtn').off('click').on('click', function(e) {
          e.preventDefault();
          var qrText = $('#qrText').val();
          if (!qrText || qrText.trim() === "") {
            alert("Please enter text or URL for QR Code");
            return;
          }

          var textToEncode = qrText.trim();
          $('#qrResult').empty().html('<div class="spinner-border text-danger my-3" role="status"><span class="sr-only">Generating QR Code with ITV Logo...</span></div>');

          // Generate display QR code (280x280) with Level H
          var displayContainer = document.createElement('div');
          new QRCode(displayContainer, {
            text: textToEncode,
            width: 280,
            height: 280,
            correctLevel: QRCode.CorrectLevel.H
          });

          // Generate high-res QR code (600x600) with Level H for download
          var highResContainer = document.createElement('div');
          new QRCode(highResContainer, {
            text: textToEncode,
            width: 600,
            height: 600,
            correctLevel: QRCode.CorrectLevel.H
          });

          setTimeout(function() {
            var dispCanvas = displayContainer.querySelector('canvas');
            var hrCanvas = highResContainer.querySelector('canvas');

            if (dispCanvas) {
              embedItvLogo(dispCanvas, function() {
                var finalDisplayUrl = dispCanvas.toDataURL('image/png');
                $('#qrResult').empty().append(
                  $('<img>')
                    .attr('src', finalDisplayUrl)
                    .attr('alt', 'Independent Television QR Code')
                    .css({
                      'max-width': '100%',
                      'height': 'auto',
                      'border-radius': '10px',
                      'box-shadow': '0 4px 14px rgba(0,0,0,0.12)'
                    })
                );
              });
            }

            if (hrCanvas) {
              embedItvLogo(hrCanvas, function() {
                highResDataUrl = hrCanvas.toDataURL('image/png');
                $('#saveBtn').removeClass('d-none');
              });
            }
          }, 250);
        });

        $('#saveBtn').off('click').on('click', function(e) {
          e.preventDefault();
          if (!highResDataUrl) {
            var currentImg = $('#qrResult img').attr('src');
            if (currentImg) highResDataUrl = currentImg;
          }
          if (!highResDataUrl) return;

          var a = document.createElement('a');
          a.href = highResDataUrl;
          a.download = 'itv-qrcode-' + Date.now() + '.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });
      }

      if (window.jQuery) {
        $(document).ready(setupItvGenerator);
      } else {
        document.addEventListener('DOMContentLoaded', setupItvGenerator);
      }
    </script>
  `;

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

      // Ensure base URL so relative assets (style.css, qrcode.min.js) resolve correctly
      if (!html.includes('<base')) {
        html = html.replace('<head>', '<head><base href="http://202.84.45.240:2023/qrcode/">');
      }

      // Dynamically replace the static copyright year with the current dynamic year
      html = html.replace(
        /Developed by ITV IT © \d{4} \| All rights reserved\./gi,
        `Developed by ITV IT &copy; <span id="dyn-current-year">${currentYear}</span> | All rights reserved.`
      );
      html = html.replace(
        /Developed by ITV IT &copy; \d{4} \| All rights reserved\./gi,
        `Developed by ITV IT &copy; <span id="dyn-current-year">${currentYear}</span> | All rights reserved.`
      );

      // Remove the old plain script.js and inject our ITV Logo-embedded generator script
      html = html.replace(/<script[^>]*src=["']script\.js["'][^>]*><\/script>/gi, '');

      if (html.includes('</body>')) {
        html = html.replace('</body>', `${logoScript}</body>`);
      } else {
        html += logoScript;
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

  // Self-contained fallback with Independent Television logo and dynamic year
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
                    <!-- QR Code with ITV Logo will be displayed here -->
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
    ${logoScript}
</body>
</html>`;

  return new Response(fallbackHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

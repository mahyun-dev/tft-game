# PWA 아이콘 생성 스크립트
# PIL 라이브러리가 필요합니다: pip install pillow

try:
    from PIL import Image, ImageDraw, ImageFont
    
    def create_icon(size, filename):
        # 배경색 (군사 녹색)
        img = Image.new('RGB', (size, size), color='#3d5a3d')
        draw = ImageDraw.Draw(img)
        
        # 원 그리기 (금색)
        margin = size // 6
        draw.ellipse([margin, margin, size-margin, size-margin], 
                     fill='#2a3d2a', outline='#ffd700', width=size//20)
        
        # 텍스트 추가
        try:
            font_size = size // 3
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        text = "🪖"
        # 텍스트 중앙 정렬
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (size - text_width) // 2
        y = (size - text_height) // 2
        
        draw.text((x, y), text, fill='#ffd700', font=font)
        
        # 저장
        img.save(filename, 'PNG')
        print(f"✅ {filename} 생성 완료 ({size}x{size})")
    
    # 아이콘 생성
    create_icon(192, 'icon-192.png')
    create_icon(512, 'icon-512.png')
    
    print("\n✅ 모든 아이콘 생성 완료!")
    print("icon-192.png와 icon-512.png 파일을 확인하세요.")

except ImportError:
    print("❌ PIL 라이브러리가 설치되지 않았습니다.")
    print("다음 명령어로 설치하세요: pip install pillow")
    print("\n또는 generate-icons.html을 브라우저에서 열어 아이콘을 생성하세요.")

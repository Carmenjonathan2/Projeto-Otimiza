"""
Script de Teste - Prompts V2.0 PREMIUM
Testa a geração de imagens com os novos prompts otimizados
"""

import os
from image_creator import ImageCreator
from datetime import datetime

def test_premium_prompts():
    """
    Testa os novos prompts premium em todas as categorias
    """
    
    print("=" * 80)
    print("TESTE DE PROMPTS V2.0 PREMIUM")
    print("=" * 80)
    print()
    
    # Criar diretório de testes
    test_dir = "test_images_v2_premium"
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)
        print(f"[OK] Diretório criado: {test_dir}")
    
    # Inicializar ImageCreator
    print("\nInicializando ImageCreator...")
    creator = ImageCreator()
    
    # Casos de teste por categoria
    test_cases = [
        {
            "category": "Nutrição",
            "title": "Alimentação Natural para Cães",
            "subtitle": "Nutrição balanceada e saudável",
            "filename": "01_nutricao_caes.png"
        },
        {
            "category": "Nutrição",
            "title": "Dieta Balanceada para Gatos",
            "subtitle": "Saúde começa pela alimentação",
            "filename": "02_nutricao_gatos.png"
        },
        {
            "category": "Saúde Preventiva",
            "title": "Vacinação Anual de Cães",
            "subtitle": "Proteção completa para seu melhor amigo",
            "filename": "03_vacina_caes.png"
        },
        {
            "category": "Saúde Preventiva",
            "title": "Vacinação de Gatos Filhotes",
            "subtitle": "Comece cedo a proteção",
            "filename": "04_vacina_gatos.png"
        },
        {
            "category": "Saúde",
            "title": "Check-up Veterinário para Cães",
            "subtitle": "Cuidados preventivos essenciais",
            "filename": "05_checkup_caes.png"
        },
        {
            "category": "Saúde",
            "title": "Consulta Veterinária para Gatos",
            "subtitle": "Saúde em primeiro lugar",
            "filename": "06_consulta_gatos.png"
        },
        {
            "category": "Higiene",
            "title": "Banho e Tosa para Cães",
            "subtitle": "Beleza e higiene profissional",
            "filename": "07_banho_caes.png"
        },
        {
            "category": "Higiene",
            "title": "Grooming para Gatos Persas",
            "subtitle": "Cuidados especiais para pelos longos",
            "filename": "08_grooming_gatos.png"
        },
        {
            "category": "Comportamento",
            "title": "Brincadeiras para Cães Ativos",
            "subtitle": "Exercício e diversão",
            "filename": "09_comportamento_caes.png"
        },
        {
            "category": "Comportamento",
            "title": "Enriquecimento Ambiental para Gatos",
            "subtitle": "Estimule seu felino",
            "filename": "10_comportamento_gatos.png"
        },
        {
            "category": "Idosos",
            "title": "Cuidados com Cães Idosos",
            "subtitle": "Conforto na terceira idade",
            "filename": "11_idosos_caes.png"
        },
        {
            "category": "Idosos",
            "title": "Gatos Seniores Merecem Cuidados Especiais",
            "subtitle": "Qualidade de vida na maturidade",
            "filename": "12_idosos_gatos.png"
        },
        {
            "category": "Primeiros Socorros",
            "title": "Kit de Primeiros Socorros para Cães",
            "subtitle": "Esteja sempre preparado",
            "filename": "13_primeiros_socorros_caes.png"
        },
        {
            "category": "Primeiros Socorros",
            "title": "Emergências com Gatos",
            "subtitle": "Saiba como agir",
            "filename": "14_primeiros_socorros_gatos.png"
        }
    ]
    
    print(f"\n[INFO] Total de testes: {len(test_cases)}")
    print("=" * 80)
    
    # Executar testes
    results = {
        "success": [],
        "failed": []
    }
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n[{i}/{len(test_cases)}] Testando: {test['category']} - {test['title']}")
        print("-" * 80)
        
        output_path = os.path.join(test_dir, test['filename'])
        
        try:
            # Gerar imagem
            creator.create_pin_image(
                title=test['title'],
                subtitle=test['subtitle'],
                output_path=output_path,
                category=test['category']
            )
            
            # Verificar se arquivo foi criado
            if os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                print(f"[OK] SUCESSO - Arquivo criado: {test['filename']} ({file_size:,} bytes)")
                results["success"].append({
                    "test": test,
                    "path": output_path,
                    "size": file_size
                })
            else:
                print(f"[FAIL] FALHA - Arquivo não foi criado")
                results["failed"].append({
                    "test": test,
                    "error": "File not created"
                })
                
        except Exception as e:
            print(f"[ERROR] ERRO - {str(e)}")
            results["failed"].append({
                "test": test,
                "error": str(e)
            })
    
    # Relatório final
    print("\n" + "=" * 80)
    print("RELATÓRIO FINAL")
    print("=" * 80)
    print(f"\n[OK] Sucessos: {len(results['success'])}/{len(test_cases)}")
    print(f"[FAIL] Falhas: {len(results['failed'])}/{len(test_cases)}")
    
    if results['success']:
        print("\nImagens geradas com sucesso:")
        total_size = 0
        for result in results['success']:
            print(f"  - {result['test']['filename']} ({result['size']:,} bytes)")
            total_size += result['size']
        print(f"\nTamanho total: {total_size:,} bytes ({total_size/1024/1024:.2f} MB)")
    
    if results['failed']:
        print("\nTestes que falharam:")
        for result in results['failed']:
            print(f"  - {result['test']['filename']}: {result['error']}")
    
    # Salvar relatório
    report_path = os.path.join(test_dir, "test_report.txt")
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("RELATÓRIO DE TESTES - PROMPTS V2.0 PREMIUM\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total de testes: {len(test_cases)}\n")
        f.write(f"Sucessos: {len(results['success'])}\n")
        f.write(f"Falhas: {len(results['failed'])}\n\n")
        
        if results['success']:
            f.write("SUCESSOS:\n")
            f.write("-" * 80 + "\n")
            for result in results['success']:
                f.write(f"[OK] {result['test']['category']} - {result['test']['title']}\n")
                f.write(f"   Arquivo: {result['test']['filename']}\n")
                f.write(f"   Tamanho: {result['size']:,} bytes\n\n")
        
        if results['failed']:
            f.write("\nFALHAS:\n")
            f.write("-" * 80 + "\n")
            for result in results['failed']:
                f.write(f"[FAIL] {result['test']['category']} - {result['test']['title']}\n")
                f.write(f"   Erro: {result['error']}\n\n")
    
    print(f"\nRelatório salvo em: {report_path}")
    print("\n" + "=" * 80)
    print("TESTE CONCLUÍDO!")
    print("=" * 80)
    
    return results


def test_single_prompt(category="Nutrição", title="Alimentação Natural para Cães"):
    """
    Testa um único prompt e exibe o resultado completo
    """
    
    print("=" * 80)
    print("TESTE DE PROMPT INDIVIDUAL")
    print("=" * 80)
    print()
    
    creator = ImageCreator()
    
    # Gerar prompt
    prompt = creator._create_optimized_prompt(
        title=title,
        subtitle="Teste de prompt",
        category=category
    )
    
    print(f"Categoria: {category}")
    print(f"Título: {title}")
    print("\n" + "-" * 80)
    print("PROMPT GERADO:")
    print("-" * 80)
    print(prompt)
    print("-" * 80)
    print()
    
    # Análise do prompt
    print("ANÁLISE DO PROMPT:")
    print("-" * 80)
    print(f"Comprimento: {len(prompt)} caracteres")
    print(f"Palavras: {len(prompt.split())} palavras")
    print(f"Linhas: {len(prompt.split(chr(10)))} linhas")
    
    # Verificar elementos-chave
    key_elements = [
        "PROFESSIONAL",
        "PREMIUM",
        "Brazilian",
        "Photorealistic",
        "Pinterest",
        "ISO",
        "lens",
        "lighting",
        "composition"
    ]
    
    print("\nElementos-chave presentes:")
    for element in key_elements:
        if element in prompt:
            print(f"  [OK] {element}")
        else:
            print(f"  [FAIL] {element} (AUSENTE)")
    
    print("\n" + "=" * 80)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--single":
        # Teste individual
        test_single_prompt()
    else:
        # Teste completo
        test_premium_prompts()

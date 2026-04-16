
import os
import sys
import json
import time
import schedule
from datetime import datetime
from automacao_gmb import AutomacaoGMB

class GMBScheduler:
    def __init__(self, calendar_file="calendario_posts_gmb.json"):
        self.automation = AutomacaoGMB()
        self.calendar_file = calendar_file
        self.published_log = "gmb_published_log.json"
        
    def load_calendar(self):
        if not os.path.exists(self.calendar_file):
            print(f"❌ Erro: Calendário {self.calendar_file} não encontrado.")
            return []
        with open(self.calendar_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def load_published_log(self):
        if os.path.exists(self.published_log):
            with open(self.published_log, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []

    def save_published_log(self, published_list):
        with open(self.published_log, 'w', encoding='utf-8') as f:
            json.dump(published_list, f, ensure_ascii=False, indent=2)

    def check_and_publish(self):
        """Verifica se há algum post para publicar no momento atual."""
        print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 🔍 Verificando posts agendados...")
        
        posts = self.load_calendar()
        published = self.load_published_log()
        published_ids = [p['titulo'] + p['data_publicacao'] for p in published] # Simplificação para ID
        
        agora = datetime.now()
        
        for post in posts:
            data_pub_str = post.get('data_publicacao')
            if not data_pub_str:
                continue
                
            try:
                # Formato esperado: YYYY-MM-DD HH:MM
                data_pub = datetime.strptime(data_pub_str, "%Y-%m-%d %H:%M")
            except Exception as e:
                print(f"   ⚠️ Erro ao processar data: {data_pub_str} - {e}")
                continue
            
            post_id = post['titulo'] + post['data_publicacao']
            
            # Se a data passou (ou é agora) e ainda não foi publicado
            if data_pub <= agora and post_id not in published_ids:
                print(f"🚀 PUBLICANDO: {post['titulo']}")
                
                # Aqui entra a lógica de publicação real via API se disponível
                # Por enquanto, simulamos a publicação e notificamos
                self._simular_publicacao(post)
                
                # Registrar como publicado
                post['data_efetiva_publicacao'] = agora.strftime("%Y-%m-%d %H:%M:%S")
                published.append(post)
                self.save_published_log(published)
                print(f"✅ Post '{post['titulo']}' publicado com sucesso!")

    def _simular_publicacao(self, post):
        """Simula o envio para o GMB."""
        # Integração futura: google-api-python-client
        print(f"   📡 Enviando para Google Business Profile API...")
        print(f"   📝 Legenda: {post['corpo'][:50]}...")
        # Simula delay de rede
        time.sleep(2)

    def run_scheduler(self):
        print("🤖 Agendador GMB Ativado!")
        print(f"📅 Monitorando: {self.calendar_file}")
        
        # Verificar a cada 15 minutos
        schedule.every(15).minutes.do(self.check_and_publish)
        
        # Executar uma vez agora
        self.check_and_publish()
        
        while True:
            schedule.run_pending()
            time.sleep(60)

if __name__ == "__main__":
    print("❌ Google My Business API (Business Profile) DESATIVADO a pedido do usuário.")
    sys.exit(0)
    import argparse
    parser = argparse.ArgumentParser(description='GMB Automation Scheduler')
    parser.add_argument('--now', action='store_true', help='Executar verificação agora')
    args = parser.parse_args()
    
    scheduler = GMBScheduler()
    
    if args.now:
        scheduler.check_and_publish()
    else:
        scheduler.run_scheduler()

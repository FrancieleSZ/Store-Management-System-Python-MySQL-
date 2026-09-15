import os
from dotenv import load_dotenv
import mysql.connector

# Carrega as variáveis do arquivo .env
load_dotenv()

def conectar():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password=os.getenv("DB_PASSWORD"), # Busca a senha de forma segura
        database="loja_de_vendas"
    )
#Um seprarador de linha, mas para a parte visual
def separar_linha(tamanho: int = 55) -> None:
    print("__"*tamanho)
#Confirmação do usúrio, caso ele fale 'Sim' o código continuará rodando
def confirmacao(mensagem:str) -> bool:
    resposta = input(mensagem)
    return resposta in ['Sim','sim','S','s']
#A parte do menu, mostra as opções que o usúario pode escolher durante o funcionamento do código
def exibir_menu() -> None:
    separar_linha()
    print("SISTEMA DE LOJA")
    separar_linha()
    print("Cadastrar nova venda [1]")
    print("Exibir relatório de vendas [2]")
    print("Cadastrar novo funcionário [3]")
    print("Pesquisar atendente por ID [4]")
    print("Sair [5]")
#A parte das perguntas para o usúario e também onde o sistema monta o relátorio criado
def venda():
    separar_linha()
    print("CADASTRAR NOVA VENDA")
    separar_linha()
    while True:
        marca_da_roupa = input("Marca da roupa:")
        if marca_da_roupa:
            break
        print("A marca da roupa não pode ficar em branco!")
    while True:
        try:
            preco_da_roupa = float(input("Preço da roupa:"))
            if preco_da_roupa > 0:
                break
            print("A roupa possui preço, verifique a etiqueta!")
        except ValueError:
            print("Digite apenas números")
    while True:
        id_da_atendente = input("ID da atendente:")
        if id_da_atendente:
            break
        print("Deve possuir o ID")
    while True:
        try:
            desconto_fornecido = int(input("Desconto fornecido:"))
            if desconto_fornecido:
                break
        except ValueError:
            print("Digite apenas números")
           
    total_da_compra = (desconto_fornecido/100)*preco_da_roupa

    separar_linha()
    try:
        conn = conectar() # Sua função de conexão
        cursor = conn.cursor()
        
        # O SQL agora recebe os novos campos
        sql = """INSERT INTO relatorios (marca_da_roupa, preco_da_roupa, id_do_atendente, desconto, total_da_compra) 
                 VALUES (%s, %s, %s, %s, %s)"""
        
        cursor.execute(sql, (marca_da_roupa, preco_da_roupa, id_da_atendente, desconto_fornecido, total_da_compra))
        
        conn.commit()
        print("Relatório salvo com sucesso!")
        
    except mysql.connector.Error as e:
        print(f"Erro ao salvar: {e}")
    finally:
        cursor.close()
        conn.close()
        

#Salva nomes e IDs dos funcionarios em uma lista
def registrar_atendente():
    # Coleta os novos dados
    nome = input("Nome completo: ")
    data_nasc = input("Data de nascimento (AAAA-MM-DD): ")
    endereco = input("Endereço: ")
    sexo = input("Sexo:")
    telefone = input("Telefone:")
    

    try:
        conn = conectar() # Sua função de conexão
        cursor = conn.cursor()
        
        # O SQL agora recebe os novos campos
        sql = """INSERT INTO funcionarios (nomes, nascimento, endereco, sexo, telefone) 
                 VALUES (%s, %s, %s, %s, %s)"""
        
        cursor.execute(sql, (nome, data_nasc, endereco, sexo, telefone))

        id = cursor.lastrowid

        conn.commit()
        print(f"\nCadastro concluído! O ID do atendente é: {id}")
        
    except mysql.connector.Error as e:
        print(f"Erro ao salvar: {e}")
    finally:
        cursor.close()
        conn.close()

def exibir_relatorio_vendas():
    try:
        conn = conectar()
        cursor = conn.cursor(dictionary=True) # dictionary=True facilita pegar os dados
        cursor.execute("SELECT * FROM relatorios")
        vendas = cursor.fetchall()

        cursor.execute("SELECT SUM(total_da_compra) as lucro_total FROM relatorios")
        resultado = cursor.fetchone()
        
        if not vendas:
            print("Nenhum relatório registrado.")
            return

        for item in vendas:
            print("RELATÓRIOS")
            print(f"Marca:       {item['marca_da_roupa']}")
            print(f"Preço da Roupa:   {item['preco_da_roupa']}")
            print(f"Id do(a) Atendente:   {item['id']}")
            print(f"Desconto:  {item['desconto']}")
            print(f"Total:  {item['total_da_compra']}")
            separar_linha()

        lucro = resultado['lucro_total'] if resultado['lucro_total'] else 0
        print(f"Lucro diário total: R$ {lucro:.2f}")

    except mysql.connector.Error as e:
        print(f"Erro ao buscar: {e}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

def buscar_atendente_por_id():
    id_procura = input("Digite o ID do atendente que deseja consultar: ")
    
    try:
        conn = conectar() # Sua função de conexão que já criamos
        cursor = conn.cursor()
        
        # O SQL busca apenas o registro onde o id_atendente for igual ao digitado
        sql = "SELECT nomes, nascimento, endereco, sexo, telefone FROM funcionarios WHERE id = %s"
        
        cursor.execute(sql, (id_procura,))
        resultado = cursor.fetchone() # Traz apenas o primeiro resultado encontrado
        
        if resultado:
            print("\n FICHA DO FUNCIONÁRIO ")
            print(f"Nome:       {resultado[0]}")
            print(f"Nascimento:   {resultado[1]}")
            print(f"Endereço:   {resultado[2]}")
            print(f"Sexo:  {resultado[3]}")
            print(f"Telefone:  {resultado[4]}")
            separar_linha()
        else:
            print("\nERRO: Nenhum funcionário encontrado com esse ID.")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Erro ao acessar o banco de dados: {e}")

def menu_principal() -> None:
    while True:
        exibir_menu()
        try:
            opcao = int(input("Escolha uma opção para continuar:"))
        except ValueError:
            print("Escolha uma opção válida!")
            continue
        if opcao == 1:
            while True:
                venda()
                if not confirmacao("Deseja cadastrar uma nova venda?"):
                    break
        elif opcao == 2:
            while True:
                exibir_relatorio_vendas()
                break
        elif opcao == 3:
            while True:
                registrar_atendente()
                if not confirmacao("Deseja cadastrar um novo atendente?"):
                    break
                return
        elif opcao == 4:
            buscar_atendente_por_id()
            break
        elif opcao == 5:
            print("Até logo!")
            break
if __name__ == "__main__":
    menu_principal()

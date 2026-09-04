import os
import threading
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor

# Carrega as variáveis do arquivo .env
load_dotenv()

app = Flask(__name__)
CORS(app)

def conectar():
       return psycopg2.connect(
           host="localhost",
           user="postgres",
           password=os.getenv("DB_PASSWORD"),
           dbname="Sistema_loja_vendas"
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
    print("Apagar cadastro do funcionario [5]")
    print("Sair [6]")
#A parte das perguntas para o usúario e também onde o sistema monta o relátorio criado
@app.route('/api/vendas', methods=['POST'])
def api_venda():
    dados = request.json
    try:
        conn = conectar() # Sua função de conexão
        cursor = conn.cursor()

        marca = dados.get("marca")
        preco = float(dados.get("preco"))
        atendente_id = int(dados.get("atendenteId"))
        desconto = int(dados.get("desconto"))
        data = dados.get("data")
        
        total = (desconto / 100) * preco
        
        # O SQL agora recebe os novos campos, com RETURNING id (equivalente ao lastrowid do MySQL)
        sql = """INSERT INTO relatorios (marca_da_roupa, preco_da_roupa, id_do_atendente, desconto, total_da_compra, data) 
                 VALUES (%s, %s, %s, %s, %s, %s) RETURNING id"""
        
        cursor.execute(sql, (marca, preco, atendente_id, desconto, total, data))
        novo_id = cursor.fetchone()[0]
        
        conn.commit()
        return jsonify("Relatório salvo com sucesso!")
        
    except psycopg2.Error as e:
        return jsonify(f"Erro ao salvar: {e}")
    finally:
        cursor.close()
        conn.close()
        

#Salva nomes e IDs dos funcionarios em uma lista
@app.route('/api/funcionarios', methods=['POST'])
def registrar_atendente():
    dados = request.json
    try:
        conn = conectar() # Sua função de conexão
        cursor = conn.cursor()
        
        # O SQL agora recebe os novos campos, com RETURNING id (equivalente ao lastrowid do MySQL)
        sql = """INSERT INTO funcionarios (nomes, nascimento, endereco, sexo, telefone) 
                 VALUES (%s, %s, %s, %s, %s) RETURNING id"""

        cursor.execute(sql, (
            dados.get("nome"),
            dados.get("nascimento"),
            dados.get("endereco"),
            dados.get("sexo"),
            dados.get("telefone")
        ))

        novo_id = cursor.fetchone()[0]

        conn.commit()
        
        return jsonify(f"\nCadastro concluído! O ID do atendente é: {novo_id}"), 201
        
    except psycopg2.Error as e:
        return jsonify(f"Erro ao salvar: {e}"), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/relatorios', methods=['GET'])
def exibir_relatorio_vendas():
    try:
        data_desejada = request.args.get("Data")
        conn = conectar()
        cursor = conn.cursor(cursor_factory=RealDictCursor) # equivalente ao dictionary=True do MySQL
        if data_desejada:
            cursor.execute("SELECT * FROM relatorios WHERE data = %s", (data_desejada,))
        else:
            cursor.execute("SELECT * FROM relatorios")
        vendas = cursor.fetchall()

        return jsonify(vendas)

    except psycopg2.Error as e:
        return jsonify(f"Erro ao buscar: {e}"), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@app.route('/api/funcionarios', methods=['GET'])
def buscar_atendente_por_id():
    try:
        conn = conectar() # Sua função de conexão que já criamos
        cursor = conn.cursor(cursor_factory=RealDictCursor) # equivalente ao dictionary=True do MySQL
        cursor.execute("SELECT id, nomes AS nome, nascimento, endereco, sexo, telefone FROM funcionarios")
        funcionarios = cursor.fetchall()
        return jsonify(funcionarios), 200
    except psycopg2.Error as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if 'conn' in locals() and conn: conn.close()

@app.route('/api/funcionarios/<int:id>', methods=['DELETE'])
def apagar_cadastro(id):
    try:
        conn = conectar() # Sua função de conexão que já criamos
        cursor = conn.cursor()
        sql = "DELETE FROM funcionarios WHERE id = %s"
        
        cursor.execute(sql, (id,))

        conn.commit()
        return jsonify("Funcionario apagado com sucesso!"), 200
    except psycopg2.Error as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if 'conn' in locals() and conn: conn.close()
    
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
                api_venda()
                if not confirmacao("Deseja cadastrar uma nova venda?"):
                    break
        elif opcao == 2:
            while True:
                exibir_relatorio_vendas()
                if not confirmacao("Deseja ver outra data?"):
                    break
        elif opcao == 3:
            while True:
                registrar_atendente()
                if not confirmacao("Deseja cadastrar um novo atendente?"):
                    break
                return
        elif opcao == 4:
            while True:
                buscar_atendente_por_id()
                if not confirmacao("Deseja buscar outro atendente?"):
                    break
                return
        elif opcao == 5:
            while True:
                apagar_cadastro()
                if not confirmacao("Deseja apagar outro cadastro?"):
                    break
        elif opcao == 6:
            print("Até logo!")
            break
if __name__ == "__main__":
    # Inicia o servidor Flask em uma thread separada para não travar o terminal
    servidor_thread = threading.Thread(target=lambda: app.run(debug=False, port=5000, use_reloader=False))
    servidor_thread.daemon = True
    servidor_thread.start()
    
    print("\n[Servidor Web / API rodando em http://localhost:5000]")
    
    # Roda o seu menu tradicional de terminal simultaneamente
    menu_principal()
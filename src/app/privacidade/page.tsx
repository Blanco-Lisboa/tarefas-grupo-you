import type { Metadata } from "next";
import "./privacidade.css";

export const metadata: Metadata = { title: "Política de Privacidade · Tarefas Grupo You" };

// Página pública (sem login): o Google exige uma Política de Privacidade para liberar o app em Produção. Texto em português simples.
export default function Page() {
  return (
    <main className="privacidade">
      <article className="privacidade-cartao">
        <header>
          <p className="privacidade-nome">Tarefas Grupo You</p>
          <h1>Política de Privacidade</h1>
          <p className="privacidade-data">Atualizada em 21/10/2026</p>
        </header>
        <section>
          <h2>Quem somos</h2>
          <p>O Tarefas Grupo You é uma ferramenta de uso interno do Grupo You. Quem usa são apenas duas pessoas da equipe: Natham e Matheus. Não é um serviço aberto ao público e não pedimos cadastro de clientes.</p>
        </section>
        <section>
          <h2>O que o app acessa no Google</h2>
          <p>Só uma permissão do Google Drive, chamada <strong>drive.file</strong>. Ela deixa o Tarefas ver e mexer apenas nas pastas e nos arquivos que o próprio Tarefas cria no Drive da conta nathamsud@gmail.com. O Tarefas <strong>não lê o resto do Drive</strong>: não abre seus outros arquivos, e-mails, contatos ou agenda.</p>
        </section>
        <section>
          <h2>Para que usamos</h2>
          <p>Guardar os vídeos, as imagens e os documentos dos conteúdos de redes sociais (roteiros, gravações e posts) de forma organizada, em pastas por empresa, formato e tema.</p>
        </section>
        <section>
          <h2>Onde ficam os dados</h2>
          <ul>
            <li>No Google Drive da conta nathamsud@gmail.com: os arquivos dos conteúdos.</li>
            <li>No Supabase (serviço de banco de dados): as tarefas, os títulos, as datas e o registro de quais arquivos pertencem a cada conteúdo.</li>
          </ul>
        </section>
        <section>
          <h2>Por quanto tempo guardamos</h2>
          <p>Sete dias depois de um conteúdo ser marcado como postado, os arquivos dele vão para a lixeira do Google Drive (onde ainda podem ser recuperados por 30 dias). A exceção são os temas e as pastas marcados como <strong>Permanentes</strong>: o que está neles fica até alguém apagar.</p>
        </section>
        <section>
          <h2>Compartilhamento</h2>
          <p>Não vendemos e não compartilhamos seus dados com terceiros. Os arquivos só são vistos por quem usa o Tarefas e pelas pessoas com quem a pasta é compartilhada dentro do Grupo You. Para publicar um conteúdo nas redes sociais, o arquivo é enviado ao Instagram ou ao Facebook apenas quando a própria equipe manda postar.</p>
        </section>
        <section>
          <h2>Como retirar o acesso</h2>
          <p>A qualquer momento você pode revogar a permissão do Tarefas em <a href="https://myaccount.google.com/permissions" rel="noopener noreferrer">myaccount.google.com/permissions</a>. Sem a permissão, o app deixa de acessar o Drive.</p>
        </section>
        <section>
          <h2>Contato</h2>
          <p>Dúvidas ou pedidos sobre seus dados: <a href="mailto:nathamsud@gmail.com">nathamsud@gmail.com</a>.</p>
        </section>
      </article>
    </main>
  );
}

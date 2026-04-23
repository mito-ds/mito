/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import pageStyles from "../../styles/Page.module.css";
import downloadsStyles from "../../styles/Downloads.module.css";
import { classNames } from "../../utils/classNames";

const MCPB_DOWNLOAD_PATH = "/mcp/mito-ai-mcp.mcpb";

const ClaudeDesktopInstallPage: NextPage = () => {
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  useEffect(() => {
    setDownloadUrl(MCPB_DOWNLOAD_PATH);
    window.location.href = MCPB_DOWNLOAD_PATH;
  }, []);

  return (
    <>
      <Head>
        <title>Install Mito AI MCP in Claude Desktop | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Download the Mito AI MCP bundle for Claude Desktop."
        />
      </Head>

      <Header />

      <div className={pageStyles.container}>
        <main className={classNames(pageStyles.main, downloadsStyles.main_small)}>
          <section className={downloadsStyles.page_header}>
            <h1 className={downloadsStyles.page_title}>Downloading MCP bundle...</h1>
            <p className={downloadsStyles.page_description}>
              If the download did not start automatically, use the link below.
            </p>
            <a
              className={pageStyles.link_with_p_tag_margins}
              href={downloadUrl || MCPB_DOWNLOAD_PATH}
              download
            >
              Download Claude Desktop extension (.mcpb)
            </a>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ClaudeDesktopInstallPage;

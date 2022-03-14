/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';

import { RichText } from 'prismic-dom';

import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { Comments } from '../../components/Comments';
import PreviewButton from '../../components/PreviewButton';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
}

export default function Post({ post, preview }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <>
        <Head>
          <title>Carregando... | Space Traveling</title>
        </Head>
        <p>Carregando...</p>
      </>
    );
  }

  const calculateAverageReadingTime = () => {
    const wordsArray = post.data.content
      .map(content => RichText.asText(content.body))
      .join(' ');

    const averageWordsReadPerMinute = 200;
    const averageReadingPost = Math.ceil(
      wordsArray.length / averageWordsReadPerMinute
    );

    return averageReadingPost;
  };

  return (
    <>
      <Head>
        <title>{post.data.title} | Space Traveling</title>
      </Head>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>
      <div className={commonStyles.wrapper}>
        <div className={styles.postContainer}>
          <article className={styles.post}>
            <h1>{post.data.title}</h1>
            <div className={styles.postData}>
              <p>
                <FiCalendar size={20} />{' '}
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </p>
              <p>
                <FiUser size={20} /> {post.data.author}
              </p>
              <p>
                <FiClock size={20} /> {calculateAverageReadingTime()} min
              </p>
            </div>
            {post.data.content &&
              post.data.content.map(content => (
                <section key={content.heading} className={styles.postContent}>
                  <h2>{content.heading}</h2>
                  <article
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                </section>
              ))}
          </article>

          <Comments />

          {preview && <PreviewButton />}
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.uid'],
    }
  );

  const listaPosts = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths: listaPosts,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(params.slug), {
    ref: previewData?.ref ?? null,
  });

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(contentText => ({
        body: contentText.body.map(bodyText => ({
          text: bodyText.text,
          spans: bodyText.spans,
          type: bodyText.type,
        })),
        heading: contentText.heading,
      })),
    },
  };

  return {
    props: {
      post,
      preview,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};

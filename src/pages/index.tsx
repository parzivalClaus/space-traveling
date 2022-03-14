import { GetStaticProps } from 'next';
import Head from 'next/head';

import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import Link from 'next/link';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import PreviewButton from '../components/PreviewButton';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [enableLoadMoreButton, setEnableLoadMoreButton] = useState<boolean>(
    !!postsPagination.next_page
  );
  const [nextPageLink, setNextPageLink] = useState<string>(
    postsPagination.next_page
  );

  const handleLoadMore = () => {
    fetch(nextPageLink).then(response =>
      response.json().then(data => {
        const postsArray = [...posts];
        const newPosts = data.results.map(item => ({
          uid: item.uid,
          first_publication_date: item.first_publication_date,
          data: {
            title: item.data.title,
            subtitle: item.data.subtitle,
            author: item.data.author,
          },
        }));

        postsArray.push(...newPosts);
        setEnableLoadMoreButton(!!data.next_page);
        setNextPageLink(data.next_page);
        setPosts(postsArray);
      })
    );
  };

  return (
    <>
      <Head>
        <title>Início | Space Traveling</title>
      </Head>
      <div className={commonStyles.wrapper}>
        <div className={styles.container}>
          <div className={styles.postContainer}>
            {posts.map(post => (
              <div key={post.uid}>
                <Link href={`/post/${post.uid}`}>
                  <a key={post.uid} href={`/post/${post.uid}`}>
                    <h1>{post.data.title}</h1>
                  </a>
                </Link>
                <p>{post.data.subtitle}</p>
                <div className={styles.creatorData}>
                  <p>
                    <FiCalendar size={20} />{' '}
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </p>
                  <p>
                    <FiUser size={20} /> {post.data.author}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {!!enableLoadMoreButton && (
            <button
              className={styles.loadMoreButton}
              type="button"
              onClick={ev => {
                ev.preventDefault();
                handleLoadMore();
              }}
            >
              Carregar mais posts
            </button>
          )}

          {preview && <PreviewButton />}
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.subtitle'],
      pageSize: 2,
      ref: previewData?.ref ?? null,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
    };
  });

  const { next_page } = postsResponse;

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page,
      },
      preview,
    },
  };
};

import {
  reactExtension,
  useApi,
  AdminBlock,
  BlockStack,
  Text,
  Heading,
  Divider,
  InlineStack,
  Link,
  Image,
  Box,
  Icon,
  ProgressIndicator,
} from '@shopify/ui-extensions-react/admin';
import { useEffect, useState } from 'react';

// The target used here must match the target used in the extension's toml file (./shopify.extension.toml)
const TARGET = 'admin.product-details.block.render';

export default reactExtension(TARGET, () => <App />);

type Collection = {
  id: string;
  title: string;
  image?: {
    url: string;
    altText: string | null;
  }
}

type CollectionData = {
  collections: {
    edges: {
      node: Collection & {
        hasProduct: boolean;
      }
    }[];
  }
}

function App() {
  // The useApi hook provides access to several useful APIs like i18n and data.
  const { data, query } = useApi(TARGET);
  const productId = data.selected[0].id;

  const [collections, setCollections] = useState<Collection[] | null>(null);

  useEffect(() => {
    async function fetchCollections() {
      const result = await query<CollectionData>(`
        collections(first: 250) {
          edges {
            node {
              id
              hasProduct(id: "${productId}")
              title
              image {
                url
                altText
              }
            }
          }
        }
      `)

      if (!result.errors && result.data) {
        const collectionsIncludingProduct = result.data.collections.edges.filter(edge => edge.node.hasProduct).map((edge) => edge.node);

        setCollections(collectionsIncludingProduct);
      } else {
        console.log(result);
      }
    }

    fetchCollections();
  }, []);

  console.log(collections);

  if (collections === null) return <InlineStack inlineAlignment='center'>
    <ProgressIndicator size="base" />
  </InlineStack>;

  if(collections.length === 0) return <InlineStack inlineAlignment='center'>
    <Heading size={3}>No collections found</Heading>
  </InlineStack>;

  const IMAGE_SIZE = 32;

  return (
    // The AdminBlock component provides an API for setting the title of the Block extension wrapper.
    <AdminBlock title="Collections Lister">
      <BlockStack gap="base">
        <Heading size={2}>Collections:</Heading>
        <BlockStack gap="large">
          {collections.map((collection, index) => {
            return (
              <>
                <Divider />
                <InlineStack inlineAlignment='space-between'>
                  <InlineStack gap="base">
                    {collection.image.url ? (<Box inlineSize={IMAGE_SIZE} blockSize={IMAGE_SIZE}>
                      <Image source={collection.image.url} alt={collection.image.altText} />
                    </Box>) : <Box inlineSize={IMAGE_SIZE} blockSize={IMAGE_SIZE}>
                      <Icon name="ImageMajor" /></Box>}
                    <Text>{collection.title}</Text>
                  </InlineStack>
                  <InlineStack inlineAlignment='end'>
                    <Link to={`shopify:admin/collections/${collection.id.split("/").at(-1)}`}>
                      View Collection</Link>
                  </InlineStack>
                </InlineStack>
              </>
            )
          }
          )}
        </BlockStack>
      </BlockStack>
    </AdminBlock>
  );
}